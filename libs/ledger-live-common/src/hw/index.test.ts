import { aTransportBuilder } from "@ledgerhq/hw-transport-mocker";
import { registerTransportModule, open } from ".";
import { CantOpenDevice, TransportError } from "@ledgerhq/errors";

jest.useFakeTimers();

describe("open", () => {
  describe("When no transport working with the device has been registered", () => {
    it("should reject with a CantOpenDevice error", async () => {
      registerTransportModule({
        id: "test_0",
        open: (_id: string, _timeoutMs?: number) => {
          // Handles no device
          return null;
        },
        disconnect: (_id: string) => {
          return Promise.resolve();
        },
      });

      const openPromise = open("device_0");
      await expect(openPromise).rejects.toBeInstanceOf(CantOpenDevice);
    });
  });

  describe("When a transport working with the device has been registered and no timeout is reached", () => {
    it("should return the associated opened Transport instance", async () => {
      registerTransportModule({
        id: "test_1",
        open: (id: string, _timeoutMs?: number) => {
          // Filters on this current test
          if (id !== "device_1") return null;

          return Promise.resolve(aTransportBuilder());
        },
        disconnect: (_id: string) => {
          return Promise.resolve();
        },
      });

      const openPromise = open("device_1");
      await expect(openPromise).resolves.toBeTruthy();
    });
  });

  describe("When the open timeout is reached", () => {
    it("should reject with an error on timeout", async () => {
      registerTransportModule({
        id: "test_2",
        open: (id: string, timeoutMs?: number) => {
          // Filters on this current test
          if (id !== "device_2") return null;

          return new Promise(resolve => {
            // The Transport is created (too late) 100ms after the timeout
            setTimeout(() => resolve(aTransportBuilder()), timeoutMs ? timeoutMs + 100 : 0);
          });
        },
        disconnect: (_id: string) => {
          return Promise.resolve();
        },
      });

      const timeoutMs = 1000;

      const openPromise = open("device_2", timeoutMs);
      jest.advanceTimersByTime(timeoutMs);
      await expect(openPromise).rejects.toBeInstanceOf(CantOpenDevice);
    });

    test("And the Transport/module implementation timeouts before open, it should still reject with an error", async () => {
      registerTransportModule({
        id: "test_3",
        open: (id: string, timeoutMs?: number) => {
          // Filters on this current test
          if (id !== "device_3") return null;

          return new Promise((_resolve, reject) => {
            // Times out before `open`
            // Rejects with another kind of error to differentiate with CantOpenDevice
            setTimeout(() => reject(new TransportError("", "")), timeoutMs ? timeoutMs - 200 : 0);
          });
        },
        disconnect: (_id: string) => {
          return Promise.resolve();
        },
      });

      const timeoutMs = 1000;

      const openPromise = open("device_3", timeoutMs);
      // Advances time after the implementation timeout but before the `open` timeout
      jest.advanceTimersByTime(timeoutMs - 100);
      await expect(openPromise).rejects.toBeInstanceOf(TransportError);
    });
  });
});
