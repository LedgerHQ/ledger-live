import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Pressable, Text } from "react-native";
import { useNavigation, type NavigationProp, type ParamListBase } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DeviceModelId, type DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { OnboardingStep } from "@features/platform-device-onboarding";
import {
  activeHidDeviceSessionSubject,
  connectNewDevice,
  ConnectNewDeviceUIStateTypes,
  rnBleTransportIdentifier,
  useDeviceManagementKit,
  type ConnectNewDeviceUIState,
} from "@ledgerhq/live-dmk-mobile";
import { activeDeviceSessionSubject, type DeviceConnectionResult } from "@ledgerhq/live-dmk-shared";
import { DeviceModelId as LedgerDeviceModelId } from "@ledgerhq/types-devices";
import { act, render, screen, waitFor, withFlagOverrides } from "@tests/test-renderer";
import { NotificationsPromptProvider } from "LLM/features/NotificationsPrompt";
import { NavigatorName, ScreenName } from "~/const";
import AccessExistingWallet from "~/screens/Onboarding/steps/accessExistingWallet";
import PostWelcomeSelection from "~/screens/Onboarding/steps/postWelcomeSelection";
import { DeviceOnboardingNavigator } from "../navigation/DeviceOnboardingNavigator";
import { createScriptedTestDevice } from "../testing/scriptedTestDevice";
import {
  checksTestIds,
  karaokeTestIds,
  quitConfirmationTestIds,
  syncOfferTestIds,
} from "../testIds";
import type { State } from "~/reducers/types";

// The Bluetooth scan is the hardware edge: the test plays its states.
jest.mock("@ledgerhq/live-dmk-mobile", () => ({
  ...jest.requireActual("@ledgerhq/live-dmk-mobile"),
  connectNewDevice: jest.fn(),
  useDeviceManagementKit: jest.fn(),
}));

// The firmware API is a network edge; the update screen is another flow, so only its arrival is checked.
jest.mock("@ledgerhq/live-common/deviceSDK/hooks/useGetLatestAvailableFirmware", () => {
  const { useEffect, useState } = jest.requireActual<typeof import("react")>("react");
  return {
    useGetLatestAvailableFirmware: ({ isHookEnabled }: { isHookEnabled: boolean }) => {
      const [found, setFound] = useState(false);
      useEffect(() => {
        if (isHookEnabled) setFound(true);
      }, [isHookEnabled]);
      if (!isHookEnabled) return { state: { status: "idle" } };
      return {
        state: found
          ? { status: "available-firmware", deviceInfo: {}, firmwareUpdateContext: {} }
          : { status: "ongoing" },
      };
    },
  };
});

jest.mock("~/screens/FirmwareUpdate", () => {
  const { Text: Label } = jest.requireActual("react-native");
  return { __esModule: true, default: () => <Label>firmware update screen</Label> };
});

const Root = createNativeStackNavigator();
const BaseOnboarding = createNativeStackNavigator();
const Onboarding = createNativeStackNavigator();

/** The portfolio of a read-only user: its Connect opens Get started, like the real quick action. */
function Portfolio() {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  return (
    <Pressable
      accessibilityLabel="portfolio connect"
      onPress={() =>
        navigation.navigate(NavigatorName.BaseOnboarding, {
          screen: NavigatorName.Onboarding,
          params: {
            screen: ScreenName.OnboardingPostWelcomeSelection,
            params: { userHasDevice: true, source: "portfolio" },
          },
        })
      }
    >
      <Text>portfolio</Text>
    </Pressable>
  );
}

function OnboardingNavigator() {
  return (
    <Onboarding.Navigator screenOptions={{ headerShown: false, animation: "none" }}>
      <Onboarding.Screen
        name={ScreenName.OnboardingPostWelcomeSelection}
        component={PostWelcomeSelection}
        initialParams={{ userHasDevice: true }}
      />
      <Onboarding.Screen name={ScreenName.OnboardingWelcomeBack} component={AccessExistingWallet} />
      <Onboarding.Screen name={ScreenName.OnboardingDeviceSelection}>
        {({ route }) => (
          <Text>
            {(route.params as { missingDevice?: boolean } | undefined)?.missingDevice
              ? "missing device list"
              : "device list"}
          </Text>
        )}
      </Onboarding.Screen>
    </Onboarding.Navigator>
  );
}

function BaseOnboardingNavigator() {
  return (
    <BaseOnboarding.Navigator screenOptions={{ headerShown: false, animation: "none" }}>
      <BaseOnboarding.Screen name={NavigatorName.Onboarding} component={OnboardingNavigator} />
      <BaseOnboarding.Screen name={NavigatorName.SyncOnboarding}>
        {() => <Text>old touchscreen setup</Text>}
      </BaseOnboarding.Screen>
    </BaseOnboarding.Navigator>
  );
}

type AppOptions = { firstLaunch?: boolean; offerLedgerSync?: boolean; hostsSeedSetup?: boolean };

/** Read-only users start on the portfolio; on first launch onboarding is the only screen. */
function renderApp({
  firstLaunch = false,
  offerLedgerSync = false,
  hostsSeedSetup = true,
}: AppOptions = {}) {
  const flow = (
    <Root.Screen
      name={NavigatorName.DeviceOnboarding}
      component={DeviceOnboardingNavigator}
      options={{ gestureEnabled: false }}
    />
  );
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <NotificationsPromptProvider>
        <Root.Navigator screenOptions={{ headerShown: false, animation: "none" }}>
          {firstLaunch ? (
            <Root.Screen name={NavigatorName.BaseOnboarding} component={BaseOnboardingNavigator} />
          ) : null}
          <Root.Screen name={NavigatorName.Base} component={Portfolio} />
          {firstLaunch ? null : (
            <Root.Screen name={NavigatorName.BaseOnboarding} component={BaseOnboardingNavigator} />
          )}
          {flow}
        </Root.Navigator>
      </NotificationsPromptProvider>
    </QueryClientProvider>,
    {
      overrideInitialState: withFlagOverrides(
        {
          deviceOnboarding: {
            enabled: true,
            params: {
              connectUnseededDevice: hostsSeedSetup,
              connectSeededDevice: true,
              offerLedgerSync,
            },
          },
        },
        (state: State) => ({
          ...state,
          settings: {
            ...state.settings,
            readOnlyModeEnabled: !firstLaunch,
            hasCompletedOnboarding: !firstLaunch,
          },
        }),
      ),
    },
  );
}

let emitScan: ((state: ConnectNewDeviceUIState) => void) | undefined;

function connectionResult(dmk: DeviceManagementKit, sessionId: string): DeviceConnectionResult {
  return {
    dmk,
    sessionId,
    compatDeviceId: "device-id",
    compatDeviceName: "Ledger Stax",
    compatDeviceWired: false,
    connectedDevice: {
      id: "device-id",
      name: "Ledger Stax",
      modelId: DeviceModelId.STAX,
      sessionId,
      type: "BLE",
      transport: rnBleTransportIdentifier,
    } as DeviceConnectionResult["connectedDevice"],
  };
}

/** The scan finds the Stax; pressing Connect pairs it on the scripted device. */
function showStax(device: ReturnType<typeof createScriptedTestDevice>) {
  const onConnected = jest.mocked(connectNewDevice).mock.calls.at(-1)?.[0].onConnected;
  act(() =>
    emitScan?.({
      type: ConnectNewDeviceUIStateTypes.Discovering,
      devices: [
        {
          key: "device-id",
          device: {
            id: "device-id",
            name: "Ledger Stax",
            deviceModelId: LedgerDeviceModelId.stax,
            transport: rnBleTransportIdentifier,
          },
          isAvailable: true,
          onSelect: () => onConnected?.(connectionResult(device.dmk, device.sessionId)),
        },
      ],
      scanningTransports: [rnBleTransportIdentifier],
      showDeviceNotFound: false,
    }),
  );
}

async function openFlow(user: ReturnType<typeof render>["user"]) {
  await user.press(await screen.findByLabelText("portfolio connect"));
  await user.press(await screen.findByTestId("onboarding-setupLedger"));
  expect(await screen.findByText("Looking for your Ledger devices")).toBeVisible();
}

describe("device onboarding flow navigation", () => {
  let device: ReturnType<typeof createScriptedTestDevice>;

  beforeEach(() => {
    activeDeviceSessionSubject.next(null);
    activeHidDeviceSessionSubject.next(null);
    device = createScriptedTestDevice();
    jest.mocked(useDeviceManagementKit).mockReturnValue(device.dmk);
    jest.mocked(connectNewDevice).mockImplementation(
      () =>
        ({
          subscribe: ({ next }: { next: (state: ConnectNewDeviceUIState) => void }) => {
            emitScan = next;
            return { unsubscribe: jest.fn() };
          },
        }) as unknown as ReturnType<typeof connectNewDevice>,
    );
  });

  it("should open the funnel when the paired device is ready", async () => {
    answerWelcome(device);
    const { user } = renderApp();

    await openFlow(user);
    showStax(device);
    await user.press(screen.getByLabelText("Connect Ledger Stax"));

    expect(await screen.findByTestId(karaokeTestIds.screen)).toBeVisible();
  });

  it("should let portfolio Connect open the flow again after the user leaves the funnel", async () => {
    answerWelcome(device);
    const { user } = renderApp();

    await openFlow(user);
    showStax(device);
    await user.press(screen.getByLabelText("Connect Ledger Stax"));
    await user.press(await screen.findByTestId(karaokeTestIds.close));
    await user.press(await screen.findByTestId(quitConfirmationTestIds.leave));

    expect(await screen.findByText("portfolio")).toBeVisible();
    await openFlow(user);
  });

  it("should open the flow again after the user closes the pairing screen", async () => {
    const { user } = renderApp();

    await openFlow(user);
    await user.press(screen.getByTestId("onboarding-connect-close"));

    expect(await screen.findByTestId("onboarding-setupLedger")).toBeVisible();
    await user.press(screen.getByTestId("onboarding-setupLedger"));
    expect(await screen.findByText("Looking for your Ledger devices")).toBeVisible();
  });

  it("should leave the flow for the onboarding device list when no device is found", async () => {
    const { user } = renderApp();

    await openFlow(user);
    act(() =>
      emitScan?.({
        type: ConnectNewDeviceUIStateTypes.Discovering,
        devices: [],
        scanningTransports: [rnBleTransportIdentifier],
        showDeviceNotFound: true,
      }),
    );
    await user.press(screen.getByText("I don’t see my device"));

    expect(await screen.findByText("missing device list")).toBeVisible();
  });

  it("should complete onboarding and go back to the portfolio after the checks", async () => {
    answerSeeded(device);
    const { user, store } = renderApp();

    await openFlow(user);
    await pairAndPassChecks(user, device);

    expect(await screen.findByText("portfolio")).toBeVisible();
    expect(store.getState().settings.readOnlyModeEnabled).toBe(false);
  });

  it("should open the portfolio after the checks on first launch", async () => {
    answerSeeded(device);
    const { user, store } = renderApp({ firstLaunch: true });

    await user.press(await screen.findByTestId("onboarding-setupLedger"));
    expect(await screen.findByText("Looking for your Ledger devices")).toBeVisible();
    await pairAndPassChecks(user, device);

    expect(await screen.findByText("portfolio")).toBeVisible();
    expect(store.getState().settings.hasCompletedOnboarding).toBe(true);
  });

  it("should open Ledger Sync from the sync offer after the checks", async () => {
    answerSeeded(device);
    const { user } = renderApp({ offerLedgerSync: true });

    await openFlow(user);
    await pairAndPassChecks(user, device);
    await user.press(await screen.findByTestId(syncOfferTestIds.activate));

    expect(await screen.findByText("Choose a Ledger device")).toBeVisible();
  });

  it("should leave the flow for the old setup when this flow cannot set up the device", async () => {
    answerWelcome(device);
    const { user } = renderApp({ hostsSeedSetup: false });

    await user.press(await screen.findByLabelText("portfolio connect"));
    await user.press(await screen.findByTestId("onboarding-accessWallet"));
    await user.press(await screen.findByTestId("Existing Wallet | Connect"));
    expect(await screen.findByText("Looking for your Ledger devices")).toBeVisible();
    showStax(device);
    await user.press(screen.getByLabelText("Connect Ledger Stax"));

    expect(await screen.findByText("old touchscreen setup")).toBeVisible();
  });

  it("should open the firmware update inside the flow when the user accepts it", async () => {
    answerSeeded(device);
    const { user } = renderApp();

    await openFlow(user);
    showStax(device);
    await user.press(screen.getByLabelText("Connect Ledger Stax"));
    await user.press(await screen.findByTestId(checksTestIds.start));
    await waitFor(() => act(() => device.passGenuineCheck()));
    await waitFor(() => act(() => device.reportAvailableFirmware()));
    await user.press(await screen.findByText("Update now"));

    expect(await screen.findByText("firmware update screen")).toBeVisible();
  });
});

function answerWelcome(device: ReturnType<typeof createScriptedTestDevice>) {
  device.answerState({
    onboardingState: OnboardingStep.WelcomeScreen1,
    numberOfWords: 24,
    currentWordIndex: 0,
  });
}

function answerSeeded(device: ReturnType<typeof createScriptedTestDevice>) {
  device.answerState({
    onboardingState: OnboardingStep.Ready,
    numberOfWords: 24,
    currentWordIndex: 0,
    isOnboarded: true,
  });
}

/** Pairs the scripted Stax, passes the genuine and firmware checks, and continues. */
async function pairAndPassChecks(
  user: ReturnType<typeof render>["user"],
  device: ReturnType<typeof createScriptedTestDevice>,
) {
  showStax(device);
  await user.press(screen.getByLabelText("Connect Ledger Stax"));
  await user.press(await screen.findByTestId(checksTestIds.start));
  await waitFor(() => act(() => device.passGenuineCheck()));
  device.acceptToggle();
  await waitFor(() => act(() => device.reportFirmwareUpToDate()));
  await user.press(await screen.findByTestId(checksTestIds.continue));
}
