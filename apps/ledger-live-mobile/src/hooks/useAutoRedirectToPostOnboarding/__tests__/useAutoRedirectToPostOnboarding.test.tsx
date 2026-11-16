import React from "react";
import { Linking, Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { PostOnboardingProvider } from "@ledgerhq/live-common/postOnboarding/PostOnboardingProvider";
import { getNetworkState } from "@shared/network-status";
import { render, screen, waitFor, withFlagOverrides } from "@tests/test-renderer";
import { getPostOnboardingAction, getPostOnboardingActionsForDevice } from "~/logic/postOnboarding";
import type { State } from "~/reducers/types";
import { useAutoRedirectToPostOnboarding } from "..";

const Stack = createNativeStackNavigator();
const navigateToPostOnboardingHub = jest.fn();

function RedirectStatusScreen() {
  const status = useAutoRedirectToPostOnboarding();
  return <Text>{status}</Text>;
}

function PortfolioWithRedirect() {
  return (
    <PostOnboardingProvider
      navigateToPostOnboardingHub={navigateToPostOnboardingHub}
      getPostOnboardingAction={getPostOnboardingAction}
      getPostOnboardingActionsForDevice={getPostOnboardingActionsForDevice}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Portfolio" component={RedirectStatusScreen} />
      </Stack.Navigator>
    </PostOnboardingProvider>
  );
}

function withJustOnboardedDevice(
  modelId: DeviceModelId,
  settingsOverrides: Partial<State["settings"]> = {},
) {
  return (state: State): State => ({
    ...state,
    settings: {
      ...state.settings,
      lastConnectedDevice: { deviceId: "device-id", modelId, wired: true },
      hasBeenRedirectedToPostOnboarding: false,
      hasBeenUpsoldProtect: true,
      ...settingsOverrides,
    },
  });
}

const withRecoverUpsellDue = withFlagOverrides(
  {
    recoverUpsellPostOnboarding: { enabled: true },
    protectServicesMobile: { enabled: true },
  },
  withJustOnboardedDevice(DeviceModelId.nanoX, { hasBeenUpsoldProtect: false }),
);

describe("useAutoRedirectToPostOnboarding", () => {
  let openURLSpy: jest.SpiedFunction<typeof Linking.openURL>;

  beforeEach(() => {
    jest.clearAllMocks();
    openURLSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
  });

  afterEach(() => {
    openURLSpy.mockRestore();
  });

  it("should report none when no redirect is due", async () => {
    render(<PortfolioWithRedirect />);

    expect(await screen.findByText("none")).toBeVisible();
    expect(navigateToPostOnboardingHub).not.toHaveBeenCalled();
  });

  it("should report pending and then redirected when the post onboarding hub opens", async () => {
    render(<PortfolioWithRedirect />, {
      overrideInitialState: withJustOnboardedDevice(DeviceModelId.nanoS),
    });

    expect(await screen.findByText("pending")).toBeVisible();
    expect(await screen.findByText("redirected")).toBeVisible();
    expect(navigateToPostOnboardingHub).toHaveBeenCalledTimes(1);
  });

  it("should report none when the device has no post onboarding actions", async () => {
    const { store } = render(<PortfolioWithRedirect />, {
      overrideInitialState: withJustOnboardedDevice(DeviceModelId.blue),
    });

    expect(await screen.findByText("none")).toBeVisible();
    expect(navigateToPostOnboardingHub).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(store.getState().postOnboarding.postOnboardingInProgress).toBe(false);
    });
  });

  it("should report none when opening the post onboarding hub fails", async () => {
    navigateToPostOnboardingHub.mockImplementationOnce(() => {
      throw new Error("navigation failed");
    });

    render(<PortfolioWithRedirect />, {
      overrideInitialState: withJustOnboardedDevice(DeviceModelId.nanoS),
    });

    expect(await screen.findByText("none")).toBeVisible();
    expect(navigateToPostOnboardingHub).toHaveBeenCalledTimes(1);
  });

  it("should report redirected when the Recover upsell link opens", async () => {
    render(<PortfolioWithRedirect />, { overrideInitialState: withRecoverUpsellDue });

    expect(await screen.findByText("pending")).toBeVisible();
    expect(await screen.findByText("redirected")).toBeVisible();
    expect(openURLSpy).toHaveBeenCalledTimes(1);
  });

  it("should report none when the Recover upsell link fails to open", async () => {
    openURLSpy.mockRejectedValueOnce(new Error("cannot open url"));

    render(<PortfolioWithRedirect />, { overrideInitialState: withRecoverUpsellDue });

    expect(await screen.findByText("none")).toBeVisible();
    expect(openURLSpy).toHaveBeenCalledTimes(1);
  });

  it("should report none when the Recover upsell is due but the device is offline", async () => {
    jest
      .mocked(getNetworkState)
      .mockResolvedValueOnce({ isConnected: false, isInternetReachable: false });

    render(<PortfolioWithRedirect />, { overrideInitialState: withRecoverUpsellDue });

    expect(await screen.findByText("none")).toBeVisible();
    expect(openURLSpy).not.toHaveBeenCalled();
  });

  it("should report none when the Recover upsell is due but Recover services are disabled", async () => {
    render(<PortfolioWithRedirect />, {
      overrideInitialState: withFlagOverrides(
        { protectServicesMobile: { enabled: false } },
        withRecoverUpsellDue,
      ),
    });

    expect(await screen.findByText("none")).toBeVisible();
    expect(openURLSpy).not.toHaveBeenCalled();
  });
});
