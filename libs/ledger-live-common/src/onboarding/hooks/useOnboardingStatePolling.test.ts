import { from, TimeoutError } from "rxjs";
import { renderHook, act } from "@testing-library/react-hooks";
import { DeviceModelId } from "@ledgerhq/devices";
import { useOnboardingStatePolling } from "./useOnboardingStatePolling";
import { withDevice } from "../../hw/deviceAccess";
import getVersion from "../../hw/getVersion";
import {
  extractOnboardingState,
  OnboardingState,
  SeedPhraseType,
  OnboardingStep,
} from "../../hw/extractOnboardingState";
import Transport from "@ledgerhq/hw-transport";
import {
  DeviceOnboardingStatePollingError,
  DeviceExtractOnboardingStateError,
} from "@ledgerhq/errors";

jest.mock("../../hw/deviceAccess");
jest.mock("../../hw/getVersion");
jest.mock("../../hw/extractOnboardingState");
jest.mock("@ledgerhq/hw-transport");
jest.useFakeTimers();

const aDevice = {
  deviceId: "DEVICE_ID_A",
  deviceName: "DEVICE_NAME_A",
  modelId: DeviceModelId.nanoFTS,
  wired: false,
};

// As extractOnboardingState is mocked, the firmwareInfo
// returned by getVersion does not matter
const aFirmwareInfo = {
  isBootloader: false,
  rawVersion: "",
  targetId: 0,
  mcuVersion: "",
  flags: Buffer.from([]),
};

const pollingPeriodMs = 1000;

const mockedGetVersion = jest.mocked(getVersion);
// const mockedWithDevice = withDevice as jest.Mock;
const mockedWithDevice = jest.mocked(withDevice);
mockedWithDevice.mockReturnValue((job) => from(job(new Transport())));

const mockedExtractOnboardingState = jest.mocked(extractOnboardingState);

describe("useOnboardingStatePolling", () => {
  let anOnboardingState: OnboardingState;

  beforeEach(() => {
    anOnboardingState = {
      isOnboarded: false,
      isInRecoveryMode: false,
      seedPhraseType: SeedPhraseType.TwentyFour,
      currentSeedWordIndex: 0,
      currentOnboardingStep: OnboardingStep.NewDevice,
    };
  });

  afterEach(() => {
    mockedGetVersion.mockClear();
    mockedExtractOnboardingState.mockClear();
  });

  describe("When polling returns incorrect information on the device state", () => {
    it("should return a null onboarding state, continue the polling and keep track of the error", async () => {
      mockedGetVersion.mockResolvedValue(aFirmwareInfo);
      mockedExtractOnboardingState.mockImplementation(() => {
        throw new DeviceExtractOnboardingStateError(
          "Some incorrect device info"
        );
      });

      const device = aDevice;

      const { result, waitForNextUpdate } = renderHook(() =>
        useOnboardingStatePolling({ device, pollingPeriodMs })
      );

      await act(async () => {
        jest.advanceTimersByTime(1);
        // Waits for the hook update as we don't know how much time it should take
        await waitForNextUpdate();
      });

      expect(result.current.onboardingState).toBeNull();
      expect(result.current.allowedError).toBeInstanceOf(
        DeviceExtractOnboardingStateError
      );
      expect(result.current.fatalError).toBeNull();
    });
  });

  describe("When an error occurs during polling", () => {
    describe("and the error is thrown before the defined timeout", () => {
      it("should update the onboarding state to null and keep track of the error (here fatal error)", async () => {
        mockedGetVersion.mockRejectedValue(new Error("Unknown error"));

        const device = aDevice;

        const { result, waitForNextUpdate } = renderHook(() =>
          useOnboardingStatePolling({ device, pollingPeriodMs })
        );

        await act(async () => {
          jest.advanceTimersByTime(1);
          await waitForNextUpdate();
        });

        expect(result.current.onboardingState).toBeNull();
        expect(result.current.allowedError).toBeNull();
        expect(result.current.fatalError).toBeInstanceOf(
          DeviceOnboardingStatePollingError
        );
      });
    });

    describe("and when a timeout occurred before the error (or the fetch took too long)", () => {
      it("should update the allowed error value to notify the consumer", async () => {
        mockedGetVersion.mockResolvedValue(aFirmwareInfo);
        mockedExtractOnboardingState.mockReturnValue(anOnboardingState);

        const device = aDevice;

        const { result } = renderHook(() =>
          useOnboardingStatePolling({ device, pollingPeriodMs })
        );

        await act(async () => {
          // Waits more than the timeout
          jest.advanceTimersByTime(pollingPeriodMs + 1);
        });

        expect(result.current.allowedError).toBeInstanceOf(TimeoutError);
        expect(result.current.fatalError).toBeNull();
        expect(result.current.onboardingState).toBeNull();
      });
    });
  });

  describe("When polling returns a correct device state", () => {
    it("should return a correct onboarding state", async () => {
      mockedGetVersion.mockResolvedValue(aFirmwareInfo);
      mockedExtractOnboardingState.mockReturnValue(anOnboardingState);

      const device = aDevice;

      const { result, waitForNextUpdate } = renderHook(() =>
        useOnboardingStatePolling({ device, pollingPeriodMs })
      );

      await act(async () => {
        jest.advanceTimersByTime(1);
        await waitForNextUpdate();
      });

      expect(result.current.fatalError).toBeNull();
      expect(result.current.allowedError).toBeNull();
      expect(result.current.onboardingState).toEqual(anOnboardingState);
    });

    it("should poll a new onboarding state after the defined period of time", async () => {
      mockedGetVersion.mockResolvedValue(aFirmwareInfo);
      mockedExtractOnboardingState
        .mockReturnValueOnce(anOnboardingState)
        .mockReturnValue({
          ...anOnboardingState,
          currentOnboardingStep: OnboardingStep.NewDevice,
        });

      const device = aDevice;

      const { result, waitForNextUpdate } = renderHook(() =>
        useOnboardingStatePolling({ device, pollingPeriodMs })
      );

      await act(async () => {
        jest.advanceTimersByTime(1);
        await waitForNextUpdate();
        jest.advanceTimersByTime(pollingPeriodMs + 1);
        await waitForNextUpdate();
      });

      // Another run of the polling could have started between the waitForNextUpdate()
      // and the advanceTimersByTime(pollingPeriodMs), so more than 2 calls could have happened
      expect(mockedGetVersion.mock.calls.length).toBeGreaterThanOrEqual(2);

      expect(result.current.fatalError).toBeNull();
      expect(result.current.allowedError).toBeNull();
      expect(result.current.onboardingState).toEqual(anOnboardingState);
    });

    describe("and when the hook consumer stops the polling", () => {
      it("should stop the polling and stop fetching the device onboarding state", async () => {
        mockedGetVersion.mockResolvedValue(aFirmwareInfo);
        mockedExtractOnboardingState.mockReturnValue(anOnboardingState);

        const device = aDevice;
        let stopPolling = false;

        const { result, waitForNextUpdate, rerender } = renderHook(() =>
          useOnboardingStatePolling({ device, pollingPeriodMs, stopPolling })
        );

        await act(async () => {
          jest.advanceTimersByTime(1);
          await waitForNextUpdate();
        });

        // Everything is normal on the first run
        expect(mockedGetVersion).toHaveBeenCalledTimes(1);
        expect(result.current.fatalError).toBeNull();
        expect(result.current.allowedError).toBeNull();
        expect(result.current.onboardingState).toEqual(anOnboardingState);

        // The consumer stops the polling
        stopPolling = true;
        rerender({ device, pollingPeriodMs, stopPolling });
        // If another run of the polling started, it will max terminated in pollingPeriodMs
        jest.advanceTimersByTime(pollingPeriodMs);
        mockedGetVersion.mockClear();
        mockedGetVersion.mockResolvedValue(aFirmwareInfo);

        await act(async () => {
          // Waits as long as we want
          jest.advanceTimersByTime(10 * pollingPeriodMs);
        });

        // No polling should occur
        expect(mockedGetVersion).toHaveBeenCalledTimes(0);
        // And the state should stay the same
        expect(result.current.fatalError).toBeNull();
        expect(result.current.allowedError).toBeNull();
        expect(result.current.onboardingState).toEqual(anOnboardingState);
      });
    });
  });
});
