import React from "react";
import { render, act } from "@tests/test-renderer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { OnboardingStep } from "@ledgerhq/live-common/hw/extractOnboardingState";
import { useOnboardingStatePolling } from "@ledgerhq/live-common/onboarding/hooks/useOnboardingStatePolling";
import { useToggleOnboardingEarlyCheck } from "@ledgerhq/live-common/deviceSDK/hooks/useToggleOnboardingEarlyChecks";
import { SeedPhraseType } from "@ledgerhq/types-live";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { ScreenName } from "~/const";
import { SyncOnboarding } from ".";
import { EarlySecurityCheck } from "./EarlySecurityCheck";

jest.mock("@ledgerhq/live-common/onboarding/hooks/useOnboardingStatePolling", () => ({
  useOnboardingStatePolling: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/deviceSDK/hooks/useToggleOnboardingEarlyChecks", () => ({
  useToggleOnboardingEarlyCheck: jest.fn(),
}));

jest.mock("./EarlySecurityCheck", () => ({
  EarlySecurityCheck: jest.fn(() => null),
}));

jest.mock(
  "LLM/features/Onboarding/screens/SyncOnboardingCompanion/components/TwoStepSyncOnboardingCompanion",
  () => ({
    __esModule: true,
    default: jest.fn(() => null),
  }),
);

const mockedUseOnboardingStatePolling = jest.mocked(useOnboardingStatePolling);
const mockedUseToggleOnboardingEarlyCheck = jest.mocked(useToggleOnboardingEarlyCheck);
const mockedEarlySecurityCheck = jest.mocked(EarlySecurityCheck);

const deviceA: Device = {
  deviceId: "device-a",
  deviceName: "Device A",
  modelId: DeviceModelId.europa,
  wired: true,
};

const deviceB: Device = {
  deviceId: "device-b",
  deviceName: "Device B",
  modelId: DeviceModelId.europa,
  wired: true,
};

const Stack = createNativeStackNavigator<BaseNavigatorStackParamList>();

const MockedComponent = ({ device }: { device: Device }) => (
  <Stack.Navigator initialRouteName={ScreenName.MockedWalletScreen}>
    <Stack.Screen name={ScreenName.MockedWalletScreen}>
      {() => (
        <SyncOnboarding
          navigation={
            {
              setOptions: jest.fn(),
              popToTop: jest.fn(),
              goBack: jest.fn(),
            } as unknown as React.ComponentProps<typeof SyncOnboarding>["navigation"]
          }
          route={
            {
              key: "testKey",
              name: ScreenName.SyncOnboardingCompanion,
              params: { device },
            } as unknown as React.ComponentProps<typeof SyncOnboarding>["route"]
          }
        />
      )}
    </Stack.Screen>
  </Stack.Navigator>
);

function renderScreen(currentDevice: Device) {
  const resetStates = jest.fn();
  mockedUseOnboardingStatePolling.mockReturnValue({
    onboardingState: {
      currentOnboardingStep: OnboardingStep.OnboardingEarlyCheck,
      isOnboarded: false,
      isInRecoveryMode: false,
      seedPhraseType: SeedPhraseType.TwentyFour,
      currentSeedWordIndex: 0,
      charonSupported: false,
      charonStatus: null,
    },
    allowedError: null,
    fatalError: null,
    lockedDevice: false,
    resetStates,
  });
  mockedUseToggleOnboardingEarlyCheck.mockReturnValue({
    state: { toggleStatus: "none", lockedDevice: false, error: null },
  });

  const rendered = render(<MockedComponent device={currentDevice} />);

  return { ...rendered, resetStates };
}

function lastRenderedDeviceProp() {
  const calls = mockedEarlySecurityCheck.mock.calls;
  return calls.length ? calls[calls.length - 1][0].device : undefined;
}

describe("SyncOnboarding (mobile)", () => {
  it("forces a re-validation when the connected device changes mid-flow (DONJON-1409)", () => {
    const { resetStates, rerender } = renderScreen(deviceA);

    expect(lastRenderedDeviceProp()?.deviceId).toBe("device-a");

    act(() => {
      rerender(<MockedComponent device={deviceB} />);
    });

    expect(resetStates).toHaveBeenCalled();
    // `currentStep` is forced back to "loading" as soon as the change is detected,
    // so the new device is never handed to the (now-stale) check component.
    expect(
      mockedEarlySecurityCheck.mock.calls.some(call => call[0].device.deviceId === "device-b"),
    ).toBe(false);
  });

  it("does not reset when the same device is re-rendered", () => {
    const { resetStates, rerender } = renderScreen(deviceA);
    const callsBeforeRerender = mockedEarlySecurityCheck.mock.calls.length;

    act(() => {
      rerender(<MockedComponent device={{ ...deviceA }} />);
    });

    expect(resetStates).not.toHaveBeenCalled();
    expect(lastRenderedDeviceProp()?.deviceId).toBe("device-a");
    expect(mockedEarlySecurityCheck.mock.calls.length).toBeGreaterThanOrEqual(callsBeforeRerender);
  });
});
