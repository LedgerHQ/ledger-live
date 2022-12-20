import { timer, of } from "rxjs";
import { map, delayWhen } from "rxjs/operators";
import { renderHook, act } from "@testing-library/react-hooks";
import { DeviceModelId } from "@ledgerhq/devices";
import { DisconnectedDevice } from "@ledgerhq/errors";
import { useOnboardingStatePolling } from "./useOnboardingStatePolling";
import {
  OnboardingState,
  OnboardingStep,
} from "../../hw/extractOnboardingState";
import { SeedPhraseType } from "@ledgerhq/types-live";
import { getOnboardingStatePolling } from "../../hw/getOnboardingStatePolling";

jest.mock("../../hw/getOnboardingStatePolling");
jest.useFakeTimers();

const aDevice = {
  deviceId: "DEVICE_ID_A",
  deviceName: "DEVICE_NAME_A",
  modelId: DeviceModelId.stax,
  wired: false,
};

const pollingPeriodMs = 1000;

const mockedGetOnboardingStatePolling = jest.mocked(getOnboardingStatePolling);

describe("useOnboardingStatePolling", () => {
  let anOnboardingState: OnboardingState;
  let aSecondOnboardingState: OnboardingState;

  beforeEach(() => {
    anOnboardingState = {
      isOnboarded: false,
      isInRecoveryMode: false,
      seedPhraseType: SeedPhraseType.TwentyFour,
      currentSeedWordIndex: 0,
      currentOnboardingStep: OnboardingStep.NewDevice,
    };

    aSecondOnboardingState = {
      ...anOnboardingState,
      currentOnboardingStep: OnboardingStep.NewDeviceConfirming,
    };
  });

  afterEach(() => {
    mockedGetOnboardingStatePolling.mockClear();
  });

  describe("When polling returns a correct device state", () => {
    beforeEach(() => {
      mockedGetOnboardingStatePolling.mockReturnValue(
        of(
          {
            onboardingState: { ...anOnboardingState },
            allowedError: null,
          },
          {
            onboardingState: { ...aSecondOnboardingState },
            allowedError: null,
          },
          {
            // During the third polling, it gets the same onboarding state
            onboardingState: { ...aSecondOnboardingState },
            allowedError: null,
          }
        ).pipe(
          delayWhen((_, index) => {
            // "delay" or "delayWhen" piped to a streaming source, for ex the "of" operator, will not block the next
            // Observable to be streamed. They return an Observable that delays the emission of the source Observable,
            // but do not create a delay in-between each emission. That's why the delay is increased by multiplying by "index".
            // "concatMap" could have been used to wait for the previous Observable to complete, but
            // the "index" arg given to "delayWhen" would always be 0
            return timer(index * pollingPeriodMs);
          })
        )
      );
    });

    it("should update the onboarding state returned to the consumer", async () => {
      const device = aDevice;

      const { result } = renderHook(() =>
        useOnboardingStatePolling({ device, pollingPeriodMs })
      );

      await act(async () => {
        jest.advanceTimersByTime(1);
      });

      expect(result.current.fatalError).toBeNull();
      expect(result.current.allowedError).toBeNull();
      expect(result.current.onboardingState).toEqual(anOnboardingState);
    });

    it("should fetch again the state at a defined frequency and only update the onboarding state returned to the consumer if it different than the previous one", async () => {
      const device = aDevice;

      const { result } = renderHook(() =>
        useOnboardingStatePolling({ device, pollingPeriodMs })
      );

      await act(async () => {
        jest.advanceTimersByTime(1);
      });

      expect(result.current.fatalError).toBeNull();
      expect(result.current.allowedError).toBeNull();
      expect(result.current.onboardingState).toEqual(anOnboardingState);

      // Next polling
      await act(async () => {
        jest.advanceTimersByTime(pollingPeriodMs);
      });

      expect(result.current.fatalError).toBeNull();
      expect(result.current.allowedError).toBeNull();
      expect(result.current.onboardingState).toEqual(aSecondOnboardingState);
      // To compare with the result of the third polling
      const prevOnboardingState = result.current.onboardingState;

      // Third polling
      await act(async () => {
        jest.advanceTimersByTime(pollingPeriodMs);
      });

      expect(result.current.fatalError).toBeNull();
      expect(result.current.allowedError).toBeNull();
      // It should not have been updated
      // toBe matcher checks referential identity of object instances
      expect(result.current.onboardingState).toBe(prevOnboardingState);
    });

    describe("and when the hook consumer stops the polling", () => {
      it("should stop the polling and stop fetching the device onboarding state", async () => {
        const device = aDevice;
        let stopPolling = false;

        const { result, rerender } = renderHook(() =>
          useOnboardingStatePolling({ device, pollingPeriodMs, stopPolling })
        );

        await act(async () => {
          jest.advanceTimersByTime(1);
        });

        // Everything is normal on the first run
        expect(mockedGetOnboardingStatePolling).toHaveBeenCalledTimes(1);
        expect(result.current.fatalError).toBeNull();
        expect(result.current.allowedError).toBeNull();
        expect(result.current.onboardingState).toEqual(anOnboardingState);

        // The consumer stops the polling
        stopPolling = true;
        rerender({ device, pollingPeriodMs, stopPolling });

        await act(async () => {
          // Waits as long as we want
          jest.advanceTimersByTime(10 * pollingPeriodMs);
        });

        // While the hook was rerendered, it did not call a new time getOnboardingStatePolling
        expect(mockedGetOnboardingStatePolling).toHaveBeenCalledTimes(1);
        // And the state should stay the same (and not be aSecondOnboardingState)
        expect(result.current.fatalError).toBeNull();
        expect(result.current.allowedError).toBeNull();
        expect(result.current.onboardingState).toEqual(anOnboardingState);
      });
    });
  });

  describe("When an allowed error occurs while polling the device state", () => {
    beforeEach(() => {
      mockedGetOnboardingStatePolling.mockReturnValue(
        of(
          {
            onboardingState: { ...anOnboardingState },
            allowedError: null,
          },
          {
            onboardingState: null,
            allowedError: new DisconnectedDevice("An allowed error"),
          },
          {
            onboardingState: null,
            // During the third polling, it gets the same allowed error
            allowedError: new DisconnectedDevice("An allowed error"),
          },
          {
            onboardingState: { ...aSecondOnboardingState },
            allowedError: null,
          }
        ).pipe(
          delayWhen((_, index) => {
            return timer(index * pollingPeriodMs);
          })
        )
      );
    });

    it("should update the allowed error returned to the consumer if different than the previous one, update the fatal error to null and keep the previous onboarding state", async () => {
      const device = aDevice;

      const { result } = renderHook(() =>
        useOnboardingStatePolling({ device, pollingPeriodMs })
      );

      await act(async () => {
        jest.advanceTimersByTime(1);
      });

      // Everything is ok on the first run
      expect(result.current.fatalError).toBeNull();
      expect(result.current.allowedError).toBeNull();
      expect(result.current.onboardingState).toEqual(anOnboardingState);

      await act(async () => {
        jest.advanceTimersByTime(pollingPeriodMs);
      });

      expect(result.current.allowedError).toBeInstanceOf(DisconnectedDevice);
      expect(result.current.fatalError).toBeNull();
      expect(result.current.onboardingState).toEqual(anOnboardingState);
      // To compare with the result of the third polling
      const prevAllowedError = result.current.allowedError;

      // Thirs polling
      await act(async () => {
        jest.advanceTimersByTime(pollingPeriodMs);
      });

      expect(result.current.fatalError).toBeNull();
      expect(result.current.onboardingState).toEqual(anOnboardingState);
      // It should not have been updated
      // toBe matcher checks referential identity of object instances
      expect(result.current.allowedError).toBe(prevAllowedError);
    });

    it("should be able to recover once the allowed error is fixed and the onboarding state is updated", async () => {
      const device = aDevice;

      const { result } = renderHook(() =>
        useOnboardingStatePolling({ device, pollingPeriodMs })
      );

      await act(async () => {
        jest.advanceTimersByTime(pollingPeriodMs + 1);
      });

      // Allowed error occured
      expect(result.current.allowedError).toBeInstanceOf(DisconnectedDevice);
      expect(result.current.fatalError).toBeNull();
      expect(result.current.onboardingState).toEqual(anOnboardingState);

      await act(async () => {
        jest.advanceTimersByTime(2 * pollingPeriodMs);
      });

      // Everything is ok on the next run
      expect(result.current.fatalError).toBeNull();
      expect(result.current.allowedError).toBeNull();
      expect(result.current.onboardingState).toEqual(aSecondOnboardingState);
    });
  });

  describe("When a (fatal) error is thrown while polling the device state", () => {
    const anOnboardingStateThatShouldNeverBeReached = {
      ...aSecondOnboardingState,
    };

    beforeEach(() => {
      mockedGetOnboardingStatePolling.mockReturnValue(
        of(
          {
            onboardingState: { ...anOnboardingState },
            allowedError: null,
          },
          {
            onboardingState: { ...anOnboardingState },
            allowedError: null,
          },
          {
            // It should never be reached
            onboardingState: { ...anOnboardingStateThatShouldNeverBeReached },
            allowedError: null,
          }
        ).pipe(
          delayWhen((_, index) => {
            return timer(index * pollingPeriodMs);
          }),
          map((value, index) => {
            // Throws an error the second time
            if (index === 1) {
              throw new Error("An unallowed error");
            }
            return value;
          })
        )
      );
    });

    it("should update the fatal error returned to the consumer, update the allowed error to null, keep the previous onboarding state and stop the polling", async () => {
      const device = aDevice;

      const { result } = renderHook(() =>
        useOnboardingStatePolling({ device, pollingPeriodMs })
      );

      await act(async () => {
        jest.advanceTimersByTime(1);
      });

      // Everything is ok on the first run
      expect(result.current.fatalError).toBeNull();
      expect(result.current.allowedError).toBeNull();
      expect(result.current.onboardingState).toEqual(anOnboardingState);

      await act(async () => {
        jest.advanceTimersByTime(pollingPeriodMs);
      });

      // Fatal error on the second run
      expect(result.current.allowedError).toBeNull();
      expect(result.current.fatalError).toBeInstanceOf(Error);
      expect(result.current.onboardingState).toEqual(anOnboardingState);

      await act(async () => {
        jest.advanceTimersByTime(pollingPeriodMs);
      });

      // The polling should have been stopped, and we never update the onboardingState
      expect(result.current.allowedError).toBeNull();
      expect(result.current.fatalError).toBeInstanceOf(Error);
      expect(result.current.onboardingState).not.toEqual(
        anOnboardingStateThatShouldNeverBeReached
      );
    });
  });
});
