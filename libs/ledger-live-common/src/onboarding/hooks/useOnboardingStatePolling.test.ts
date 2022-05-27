import { from } from "rxjs";
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
      seedPhraseType: "24-words" as SeedPhraseType,
      currentSeedWordIndex: 0,
      currentOnboardingStep: OnboardingStep.newDevice,
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
    it("should return a null onboarding state and keep track of the error", async () => {
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
          currentOnboardingStep: OnboardingStep.newDevice,
        });

      const device = aDevice;

      const { result, waitForNextUpdate } = renderHook(() =>
        useOnboardingStatePolling({ device, pollingPeriodMs })
      );

      await act(async () => {
        jest.advanceTimersByTime(pollingPeriodMs + 1);
        await waitForNextUpdate();
      });

      // advanceTimersByTime + waitForNextUpdate makes the polling to run more than 1 time
      expect(mockedGetVersion.mock.calls.length).toBeGreaterThanOrEqual(2);

      expect(result.current.fatalError).toBeNull();
      expect(result.current.allowedError).toBeNull();
      expect(result.current.onboardingState).toEqual(anOnboardingState);
    });
  });
});
