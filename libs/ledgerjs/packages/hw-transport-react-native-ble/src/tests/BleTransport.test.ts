// @ts-nocheck
import scanScenarios from "./scan-scenarios";
import remapErrorScenarios from "./remapError-scenarios";
import {
  MockEventListener,
  mockedEvents,
  NativeModules,
  NativeEventEmitter,
  AppState,
  Throwable,
} from "./mocks";

// Nb We need to override all the logic from ReactNative modules and AppState
// in order to more or less cover the logic from the transport. What we can
// test in this manner is quite limited but there's also logic on live-common
// and the native side that's covered.

// The fact that some parts are static doesn't work with parallel tests either
// meaning we need to force run them in sequence.

const deviceId = "puerto";
const alreadyConnectedDevice = "alreadyConnected";
const badDeviceId = "shouldFail";

jest.mock("react-native", () => ({
  NativeModules,
  NativeEventEmitter,
  AppState,
}));

import BleTransport, { isRunningBIMQueue } from "../BleTransport";
class BleTransportWithExposedRemapError extends BleTransport {
  remapErrorExposed(...args): string {
    return super.remapError(...args);
  }
}

describe("BleTransport transport", () => {
  describe("Global", () => {
    beforeEach(async () => {
      MockEventListener.flush();
    });

    test.each(scanScenarios)("%s", (_, { rawGlobalEvents, expected }, done) => {
      const testStopListening = async () => {
        await BleTransport.stop();
        // Ensure we clear the scanObserver
        expect(BleTransport.scanObserver).toEqual(undefined);
        done();
      };

      const expectedEvents = [...expected];
      const observable = {
        next: async (actualEvent) => {
          const expectedEvent = expectedEvents.shift();
          expect(actualEvent).toEqual(expectedEvent);
          if (!expectedEvents.length) {
            await testStopListening();
          }
        },
      };

      // We correctly set the observer
      BleTransport.listen(observable);
      expect(BleTransport.scanObserver).not.toEqual(undefined);

      // Listen is resolved, we are supposed to start finding devices.
      setTimeout(() => {
        rawGlobalEvents.forEach((event) =>
          mockedEvents.next(["BleTransport", event])
        );
      }, 100);
    });

    test("Bluetooth State observing", (done) => {
      const observable = {
        next: (anyEvent) => {
          expect(anyEvent).toEqual({ type: "PoweredOn" });
          done();
        },
      };
      const sub = BleTransport.observeState(observable);
      mockedEvents.next([
        "BleTransport",
        {
          event: "status",
          type: "PoweredOn",
        },
      ]);

      sub.unsubscribe();
    });

    describe("Error mapping correctly", () => {
      test.each(remapErrorScenarios)("%s", (_, input, output) => {
        const mappedError =
          BleTransportWithExposedRemapError.remapError(input).toString();
        expect(mappedError.startsWith(output)).toBe(true);
      });
    });
  });

  describe("Transport instances", () => {
    beforeEach(async () => {
      MockEventListener.flush();
    });

    test("Static creation that resolves", async () => {
      const maybeBleInstance = await BleTransport.open(deviceId);
      expect(maybeBleInstance instanceof BleTransport).toBe(true);
      return;
    });

    test("Static creation that fails", async () => {
      try {
        await BleTransport.open(badDeviceId);
      } catch (catchedError) {
        expect(catchedError).not.toBe(undefined);
      }
      return;
    });

    test("Direct instantiation that resolves", () => {
      const transport = new BleTransport("12:34:45:67");
      expect(transport).not.toEqual(undefined);
    });

    test("Direct instantiation that fails", () => {
      try {
        new BleTransport("shouldFail");
      } catch (catchedError) {
        expect(catchedError).not.toBe(undefined);
      }
    });

    test("Instance receives AppState events", (done) => {
      const transport = new BleTransport("12:34:45:67");
      expect(transport.appState).toEqual("");

      mockedEvents.next(["change", "background"]);
      expect(transport.appState).toEqual("background");

      mockedEvents.next(["change", "active"]);
      expect(transport.appState).toEqual("active");
      done();
    });
  });

  describe("BIM Queues", () => {
    beforeEach(async () => {
      MockEventListener.flush();
      await BleTransport.disconnect();
    });

    test("Throws if we don't provide an endpoint", async () => {
      const bleTransport = await BleTransport.open(deviceId);

      try {
        bleTransport.queue(undefined, "");
        expect(isRunningBIMQueue()).toBe(false);
      } catch (error) {
        expect(error).not.toBe(undefined);
      }
    });

    test("Doesn't throw if we provide an endpoint", async () => {
      const bleTransport = await BleTransport.open(deviceId);
      bleTransport.queue({ complete: () => {} }, "", "someEndpoint");
      expect(isRunningBIMQueue()).toBe(true);
      expect(true).toBe(true); // No fail if we don't throw.
    });

    test("Already connected", async () => {
      await BleTransport.open(alreadyConnectedDevice);
      expect(true).toBe(true);
    });

    test("Can disconnect via static, and cleanup", async () => {
      const bleTransport = await BleTransport.open(deviceId);
      await bleTransport.close();

      expect(true).toBe(true);
    });

    test("Can disconnect from instance", async () => {
      await BleTransport.open(deviceId);
      BleTransport.disconnect(); // Not waited, to cover _isDisconnected_
      const disconnected = await BleTransport.disconnect();

      expect(disconnected).toBe(true);
    });

    test("Observer handles bridge runProgress correctly", (done) => {
      BleTransport.open(deviceId).then((bleTransport) => {
        const observable = {
          next: (anyEvent) => {
            expect(anyEvent).toEqual({
              type: "runProgress",
              appOp: {
                type: "install",
                name: "Bitcoin",
              },
              progress: 12.51, // we take care of rounding too
            });
            done();
          },
          complete: () => true,
        };
        mockedEvents.next([
          "BleTransport",
          {
            event: "task",
          },
        ]); // Nb shouldn't be handled, here for coverage.
        bleTransport.queue(observable, "rawQueue", "bimEndpoint");
        mockedEvents.next([
          "BleTransport",
          {
            event: "task",
            type: "runProgress",
            data: { name: "Bitcoin", type: "install", progress: 12.5123 },
          },
        ]);
      });
    });

    test("Observer handles bridge runProgress (0) correctly", (done) => {
      BleTransport.open(deviceId).then((bleTransport) => {
        const observable = {
          next: (anyEvent) => {
            expect(anyEvent).toEqual({
              type: "runProgress",
              appOp: {
                type: "install",
                name: "Bitcoin",
              },
              progress: 0, // we take care of rounding too
            });
            done();
          },
          complete: () => true,
        };
        bleTransport.queue(observable, "rawQueue", "bimEndpoint");
        mockedEvents.next([
          "BleTransport",
          {
            event: "task",
            type: "runProgress",
            data: { name: "Bitcoin", type: "install" },
          },
        ]);
      });
    });

    test("Observer handles bridge runComplete correctly", (done) => {
      BleTransport.open(deviceId).then((bleTransport) => {
        const observable = {
          complete: () => {
            done();
          },
        };
        bleTransport.queue(observable, "rawQueue", "bimEndpoint");
        mockedEvents.next([
          "BleTransport",
          {
            event: "task",
            type: "runComplete",
          },
        ]);
      });
    });

    test("Observer handles bridge runError correctly", (done) => {
      BleTransport.open(deviceId).then((bleTransport) => {
        const observable = {
          error: (_) => {
            done();
          },
        };
        bleTransport.queue(observable, "rawQueue", "bimEndpoint");
        mockedEvents.next([
          "BleTransport",
          {
            event: "task",
            type: "runError",
            data: new Throwable("cant-open-device"),
          },
        ]);
      });
    });

    test("Observer handles runStart", (done) => {
      BleTransport.open(deviceId).then((bleTransport) => {
        const observable = {
          next: (anyEvent) => {
            expect(anyEvent).toEqual({
              type: "runStart",
              appOp: {
                type: "install",
                name: "Bitcoin",
              },
            });
            done();
          },
          complete: () => true,
        };
        bleTransport.queue(observable, "rawQueue", "bimEndpoint");
        mockedEvents.next([
          "BleTransport",
          {
            event: "task",
            type: "runStart",
            data: { name: "Bitcoin", type: "install" },
          },
        ]);
      });
    });

    test("Observer handles runSuccess", (done) => {
      BleTransport.open(deviceId).then((bleTransport) => {
        const observable = {
          next: (anyEvent) => {
            expect(anyEvent).toEqual({
              type: "runSuccess",
              appOp: {
                type: "install",
                name: "Bitcoin",
              },
            });
            done();
          },
          complete: () => true,
        };
        bleTransport.queue(observable, "rawQueue", "bimEndpoint");
        mockedEvents.next([
          "BleTransport",
          {
            event: "task",
            type: "runSuccess",
            data: { name: "Bitcoin", type: "install" },
          },
        ]);
      });
    });
    test("Observer handles runBulkProgress", (done) => {
      BleTransport.open(deviceId).then((bleTransport) => {
        const observable = {
          next: (anyEvent) => {
            expect(anyEvent).toEqual({
              type: "bulk-progress",
              progress: 1.123,
              index: 123,
              total: 321,
            });
            done();
          },
          complete: () => true,
        };
        bleTransport.runner(observable, "bimEndpoint");
        mockedEvents.next([
          "BleTransport",
          {
            event: "task",
            type: "runBulkProgress",
            data: { progress: 1.123, index: 123, total: 321 },
          },
        ]);
      });
    });
  });

  describe("Direct exchanges", () => {
    test("Instance receives response from device", (done) => {
      BleTransport.open(deviceId).then(async (bleTransport) => {
        const response = await bleTransport.exchange("b001000000");
        expect(response instanceof Buffer).toBe(true);
        expect(response.toString("hex")).toMatch(
          "0105424f4c4f5305312e362e3001029000"
        );
        done();
      });
    });
    test("Instance failed exchange throws error", (done) => {
      BleTransport.open(deviceId).then(async (bleTransport) => {
        try {
          await bleTransport.exchange("some failed apdu");
        } catch (error) {
          expect(error.toString()).toMatch("CantOpenDevice: CantOpenDevice");
        }
        done();
      });
    });
  });
});
