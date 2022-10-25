import { from, Observable, of, timer } from "rxjs";
import { delay } from "rxjs/operators";
import Transport, {
  StatusCodes,
  TransportStatusError,
} from "@ledgerhq/hw-transport";
import { CantOpenDevice, DisconnectedDevice } from "@ledgerhq/errors";
import { DeviceInfo } from "@ledgerhq/types-live";
import getDeviceInfo from "./getDeviceInfo";
import { getDeviceRunningMode } from "./getDeviceRunningMode";
import { aDeviceInfoBuilder } from "../mock/fixtures/aDeviceInfo";

jest.useFakeTimers();

// Only mocks withDevice
jest.mock("./deviceAccess", () => {
  const originalModule = jest.requireActual("./deviceAccess");

  return {
    ...originalModule, // import and retain the original functionalities
    withDevice: jest.fn().mockReturnValue((job) => {
      return from(job(new Transport()));
    }),
  };
});

// Needs to mock the timer from rxjs used in retryWhileErrors
jest.mock("rxjs", () => {
  const originalModule = jest.requireActual("rxjs");

  return {
    ...originalModule,
    timer: jest.fn(),
  };
});
const mockedTimer = jest.mocked(timer);

jest.mock("./getDeviceInfo");
const mockedGetDeviceInfo = jest.mocked(getDeviceInfo);

const A_DEVICE_ID = "";

describe("getDeviceRunningMode", () => {
  beforeEach(() => {
    mockedTimer.mockReturnValue(of(1));
  });

  afterEach(() => {
    mockedTimer.mockClear();
    mockedGetDeviceInfo.mockClear();
  });

  describe("When the device is in bootloader mode", () => {
    it("pushes an event bootloaderMode", (done) => {
      const aDeviceInfo = aDeviceInfoBuilder({ isBootloader: true });
      mockedGetDeviceInfo.mockResolvedValue(aDeviceInfo);

      getDeviceRunningMode({ deviceId: A_DEVICE_ID }).subscribe({
        next: (event) => {
          try {
            expect(event.type).toBe("bootloaderMode");
            done();
          } catch (expectError) {
            done(expectError);
          }
        },
        error: (error) => {
          // It should not reach here
          done(error);
        },
      });

      jest.advanceTimersByTime(1);
    });

    describe("but for now it is restarting and/or in a unknown state", () => {
      it("it should wait and retry until the device is in bootloader", (done) => {
        const aDeviceInfo = aDeviceInfoBuilder({ isBootloader: true });

        const nbAcceptedErrors = 3;
        let count = 0;
        // Could not simply mockedRejectValueOnce several times followed by
        // a mockedResolveValueOnce. Needed to transform getDeviceInfo
        // into an Observable.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        mockedGetDeviceInfo.mockImplementation(() => {
          return new Observable<DeviceInfo>((o) => {
            if (count < nbAcceptedErrors) {
              count++;
              o.error(new DisconnectedDevice());
            } else {
              o.next(aDeviceInfo);
            }
          });
        });

        getDeviceRunningMode({
          deviceId: A_DEVICE_ID,
        }).subscribe({
          next: (event) => {
            try {
              expect(mockedTimer).toBeCalledTimes(nbAcceptedErrors);
              expect(event.type).toBe("bootloaderMode");
              done();
            } catch (expectError) {
              done(expectError);
            }
          },
          error: (error) => {
            // It should not reach here
            done(error);
          },
        });

        // No need to handle the timer with a specific value as rxjs timer has been mocked
        // because we could not advance the timer every time the retryWhileErrors is called
        jest.advanceTimersByTime(1);
      });
    });
  });

  describe("When the device is NOT in bootloader mode and unlocked", () => {
    it("pushes an event mainMode", (done) => {
      const aDeviceInfo = aDeviceInfoBuilder({ isBootloader: false });
      mockedGetDeviceInfo.mockResolvedValue(aDeviceInfo);

      getDeviceRunningMode({ deviceId: A_DEVICE_ID }).subscribe({
        next: (event) => {
          try {
            expect(event.type).toBe("mainMode");
            done();
          } catch (expectError) {
            done(expectError);
          }
        },
        error: (error) => {
          // It should not reach here
          done(error);
        },
      });

      jest.advanceTimersByTime(1);
    });
  });

  describe("When the device is locked (not in bootloader)", () => {
    describe("And is not responsive", () => {
      it("waits for a given time and pushes an event lockedDevice", (done) => {
        const unresponsiveTimeoutMs = 5000;

        // The deviceInfo will not be returned before the timeout
        // leading to an "unresponsive device"
        const aDeviceInfo = aDeviceInfoBuilder({ isBootloader: false });
        mockedGetDeviceInfo.mockResolvedValue(
          of(aDeviceInfo)
            .pipe(delay(unresponsiveTimeoutMs + 1000))
            .toPromise()
        );

        getDeviceRunningMode({
          deviceId: A_DEVICE_ID,
          unresponsiveTimeoutMs,
        }).subscribe({
          next: (event) => {
            try {
              expect(event.type).toBe("lockedDevice");
              done();
            } catch (expectError) {
              done(expectError);
            }
          },
          error: (error) => {
            // It should not reach here
            done(error);
          },
        });

        jest.advanceTimersByTime(unresponsiveTimeoutMs + 1);
      });
    });

    describe("And the device responds with a LOCKED_DEVICE error", () => {
      it("pushes an event lockedDevice", (done) => {
        mockedGetDeviceInfo.mockRejectedValue(
          new TransportStatusError(StatusCodes.LOCKED_DEVICE)
        );

        getDeviceRunningMode({
          deviceId: A_DEVICE_ID,
        }).subscribe({
          next: (event) => {
            try {
              expect(event.type).toBe("lockedDevice");
              done();
            } catch (expectError) {
              done(expectError);
            }
          },
          error: (error) => {
            // It should not reach here
            done(error);
          },
        });

        jest.advanceTimersByTime(1);
      });
    });

    describe("And the transport lib throws CantOpenDevice errors", () => {
      it("pushes an event disconnectedOrlockedDevice after a given number of retry", (done) => {
        const cantOpenDeviceRetryLimit = 3;
        mockedGetDeviceInfo.mockRejectedValue(new CantOpenDevice());

        getDeviceRunningMode({
          deviceId: A_DEVICE_ID,
          cantOpenDeviceRetryLimit,
        }).subscribe({
          next: (event) => {
            try {
              expect(mockedTimer).toBeCalledTimes(cantOpenDeviceRetryLimit);
              expect(event.type).toBe("disconnectedOrlockedDevice");
              done();
            } catch (expectError) {
              done(expectError);
            }
          },
          error: (error) => {
            // It should not reach here
            done(error);
          },
        });

        // No need to handle the timer with a specific value as rxjs timer has been mocked
        // because we could not advance the timer every time the retryWhileErrors is called
        jest.advanceTimersByTime(1);
      });
    });
  });
});
