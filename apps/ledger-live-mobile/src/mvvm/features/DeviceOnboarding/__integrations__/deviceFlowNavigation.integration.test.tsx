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
import { track, trackPage } from "@shared/analytics";
import { act, render, screen, waitFor, withFlagOverrides } from "@tests/test-renderer";
import { NotificationsPromptProvider } from "LLM/features/NotificationsPrompt";
import { NavigatorName, ScreenName } from "~/const";
import OnboardingDeviceSelection from "~/screens/Onboarding/steps/deviceSelection";
import PostWelcomeSelection from "~/screens/Onboarding/steps/postWelcomeSelection";
import { DeviceOnboardingNavigator } from "../navigation/DeviceOnboardingNavigator";
import { createScriptedTestDevice } from "../testing/scriptedTestDevice";
import { karaokeTestIds } from "@shared/ui-karaoke/native";
import {
  checksTestIds,
  unseededIntroKaraokeTestIds,
  unseededSuccessKaraokeTestIds,
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

/** A stand-in screen whose back arrow does what a real header back does. */
function BackScreen({ label }: { label: string }) {
  const navigation = useNavigation();
  return (
    <Pressable accessibilityLabel={`back from ${label}`} onPress={() => navigation.goBack()}>
      <Text>{label}</Text>
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
      <Onboarding.Screen name={ScreenName.OnboardingDeviceSelection}>
        {({ route }) =>
          (route.params as { missingDevice?: boolean } | undefined)?.missingDevice ? (
            <>
              <BackScreen label="missing device list" />
              <OnboardingDeviceSelection />
            </>
          ) : (
            <BackScreen label="device list" />
          )
        }
      </Onboarding.Screen>
      <Onboarding.Screen name={ScreenName.OnboardingUseCase}>
        {() => <BackScreen label="nano setup" />}
      </Onboarding.Screen>
    </Onboarding.Navigator>
  );
}

function BaseOnboardingNavigator() {
  return (
    <BaseOnboarding.Navigator screenOptions={{ headerShown: false, animation: "none" }}>
      <BaseOnboarding.Screen name={NavigatorName.Onboarding} component={OnboardingNavigator} />
      <BaseOnboarding.Screen name={NavigatorName.SyncOnboarding}>
        {() => <BackScreen label="old touchscreen setup" />}
      </BaseOnboarding.Screen>
    </BaseOnboarding.Navigator>
  );
}

type AppOptions = {
  firstLaunch?: boolean;
  offerLedgerSync?: boolean;
  connectUnseededDevice?: boolean;
};

/** Read-only users start on the portfolio; on first launch onboarding is the only screen. */
function renderApp({
  firstLaunch = false,
  offerLedgerSync = false,
  connectUnseededDevice = true,
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
              connectUnseededDevice,
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

function connectionResult(
  dmk: DeviceManagementKit,
  sessionId: string,
  modelId: DeviceModelId = DeviceModelId.STAX,
  name = "Ledger Stax",
): DeviceConnectionResult {
  return {
    dmk,
    sessionId,
    compatDeviceId: "device-id",
    compatDeviceName: name,
    compatDeviceWired: false,
    connectedDevice: {
      id: "device-id",
      name,
      modelId,
      sessionId,
      type: "BLE",
      transport: rnBleTransportIdentifier,
    } as DeviceConnectionResult["connectedDevice"],
  };
}

/** The scan finds the device; pressing Connect pairs it on the scripted device. */
function showTouchscreenDevice(
  device: ReturnType<typeof createScriptedTestDevice>,
  {
    dmkModelId = DeviceModelId.STAX,
    ledgerModelId = LedgerDeviceModelId.stax,
    name = "Ledger Stax",
  }: {
    dmkModelId?: DeviceModelId;
    ledgerModelId?: LedgerDeviceModelId;
    name?: string;
  } = {},
) {
  const onConnected = jest.mocked(connectNewDevice).mock.calls.at(-1)?.[0].onConnected;
  act(() =>
    emitScan?.({
      type: ConnectNewDeviceUIStateTypes.Discovering,
      devices: [
        {
          key: "device-id",
          device: {
            id: "device-id",
            name,
            deviceModelId: ledgerModelId,
            transport: rnBleTransportIdentifier,
          },
          isAvailable: true,
          onSelect: () =>
            onConnected?.(connectionResult(device.dmk, device.sessionId, dmkModelId, name)),
        },
      ],
      scanningTransports: [rnBleTransportIdentifier],
      showDeviceNotFound: false,
    }),
  );
}

function showStax(device: ReturnType<typeof createScriptedTestDevice>) {
  showTouchscreenDevice(device);
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

    expect(await screen.findByTestId(unseededIntroKaraokeTestIds.screen)).toBeVisible();
  });

  it("should let portfolio Connect open the flow again after the user leaves the funnel", async () => {
    answerWelcome(device);
    const { user } = renderApp();

    await openFlow(user);
    showStax(device);
    await user.press(screen.getByLabelText("Connect Ledger Stax"));
    await user.press(await screen.findByTestId(unseededIntroKaraokeTestIds.close));
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

  it("should open the onboarding device list above the flow when no device is found", async () => {
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

    await user.press(screen.getByLabelText("back from missing device list"));
    expect(await screen.findByText("Looking for your Ledger devices")).toBeVisible();
  });

  it("should remove the flow when the user picks a Nano from the missing device list", async () => {
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
    await user.press(await screen.findByTestId("onboarding-device-selection-nanoX"));

    expect(await screen.findByText("nano setup")).toBeVisible();
    expect(
      screen.queryByTestId("onboarding-connect-close", { includeHiddenElements: true }),
    ).toBeNull();
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

  it("should end a restore on the success karaoke and complete onboarding on its last tap", async () => {
    answerWelcome(device);
    const { user, store } = renderApp({ firstLaunch: true });
    jest.mocked(track).mockClear();

    await user.press(await screen.findByTestId("onboarding-setupLedger"));
    showStax(device);
    await user.press(screen.getByLabelText("Connect Ledger Stax"));
    for (let tap = 0; tap < 3; tap++) {
      await user.press(await screen.findByTestId(karaokeTestIds.advance));
    }
    await user.press(await screen.findByTestId(unseededIntroKaraokeTestIds.action));
    device.acceptToggle();
    await waitFor(() => act(() => device.passGenuineCheck()));
    await waitFor(() => act(() => device.reportFirmwareUpToDate()));
    device.acceptToggle();
    const words = { numberOfWords: 24, currentWordIndex: 0 };
    device.answerState({ ...words, onboardingState: OnboardingStep.RestoreSeed });
    device.answerState({ ...words, onboardingState: OnboardingStep.Ready, isOnboarded: true });

    expect(
      await screen.findByTestId(unseededSuccessKaraokeTestIds.screen, {}, { timeout: 5000 }),
    ).toBeVisible();
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
    expect(store.getState().settings.hasCompletedOnboarding).toBe(false);
    expect(seededEvents()).not.toContain("onboarding_done");

    await user.press(screen.getByTestId(karaokeTestIds.advance));
    await user.press(await screen.findByRole("button", { name: "Start exploring" }));

    expect(await screen.findByText("portfolio")).toBeVisible();
    expect(store.getState().settings.hasCompletedOnboarding).toBe(true);
    expect(seededEvents().filter(event => event === "onboarding_done")).toHaveLength(1);
  });

  it("should open Ledger Sync from the sync offer after the checks", async () => {
    answerSeeded(device);
    const { user } = renderApp({ offerLedgerSync: true });

    await openFlow(user);
    await pairAndPassChecks(user, device);
    await user.press(await screen.findByTestId(syncOfferTestIds.activate));

    expect(await screen.findByText("Choose a Ledger device")).toBeVisible();
  });

  it("should send the seeded funnel events in order, from the checks to a skipped Ledger Sync", async () => {
    answerSeeded(device);
    const { user } = renderApp({ offerLedgerSync: true });
    jest.mocked(track).mockClear();
    jest.mocked(trackPage).mockClear();

    await openFlow(user);
    await pairAndPassChecks(user, device);
    await user.press(await screen.findByTestId(syncOfferTestIds.skip));
    await user.press(await screen.findByTestId("sync-onboarding-drawer-skipCTA"));

    await waitFor(() => expect(seededEvents()).toContain("onboarding_done"));
    // The bottom sheet mock renders a closed sheet, so its page is sent early in tests only.
    const skipDrawerPage = "Page Drawer : Skip Ledger sync confirmation";
    expect(seededEvents()).toContain(skipDrawerPage);
    expect(seededEvents().filter(event => event !== skipDrawerPage)).toEqual([
      "Page Genuine Check",
      "onboarding_started",
      "button_clicked: Initiate Genuine Check",
      "Page Genuine Check started",
      "Page Check OS version",
      "Page Genuine Check & OS success",
      "button_clicked: Continue",
      "Page Ledger Sync",
      "button_clicked: Skip",
      "button_clicked: Yes, skip",
      "Page Ledger Sync Refused",
      "onboarding_done",
    ]);
  });

  it("should leave the flow for the old setup when this flow cannot set up the device", async () => {
    answerWelcome(device);
    const { user } = renderApp({ connectUnseededDevice: false });

    await user.press(await screen.findByLabelText("portfolio connect"));
    await user.press(await screen.findByTestId("onboarding-accessWallet"));
    expect(await screen.findByText("Looking for your Ledger devices")).toBeVisible();
    showStax(device);
    await user.press(screen.getByLabelText("Connect Ledger Stax"));

    expect(await screen.findByText("old touchscreen setup")).toBeVisible();
    expectFlowClosed();

    await user.press(screen.getByLabelText("back from old touchscreen setup"));
    expect(await screen.findByTestId("onboarding-accessWallet")).toBeVisible();
    expectFlowClosed();
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

  it.each([
    {
      label: "Flex",
      dmkModelId: DeviceModelId.FLEX,
      ledgerModelId: LedgerDeviceModelId.europa,
      name: "Ledger Flex",
    },
    {
      label: "Stax",
      dmkModelId: DeviceModelId.STAX,
      ledgerModelId: LedgerDeviceModelId.stax,
      name: "Ledger Stax",
    },
    {
      label: "Gen5",
      dmkModelId: DeviceModelId.APEX,
      ledgerModelId: LedgerDeviceModelId.apex,
      name: "Ledger Gen5",
    },
  ])(
    "should continue into the new unseeded onboarding flow for $label instead of legacy onboarding",
    async ({ dmkModelId, ledgerModelId, name }) => {
      const touchscreenDevice = createScriptedTestDevice({
        modelId: dmkModelId,
        ledgerModelId,
        name,
      });
      jest.mocked(useDeviceManagementKit).mockReturnValue(touchscreenDevice.dmk);
      answerWelcome(touchscreenDevice);
      const { user } = renderApp({ firstLaunch: true });

      await user.press(await screen.findByTestId("onboarding-setupLedger"));
      expect(await screen.findByText("Looking for your Ledger devices")).toBeVisible();
      showTouchscreenDevice(touchscreenDevice, { dmkModelId, ledgerModelId, name });
      await user.press(screen.getByLabelText(`Connect ${name}`));

      expect(await screen.findByTestId(unseededIntroKaraokeTestIds.screen)).toBeVisible();
      expect(screen.queryByText("old touchscreen setup")).toBeNull();
    },
  );
});

/** The seeded funnel's pages, clicks and events, in the order the app sent them. */
function seededEvents(): string[] {
  const isSeeded = (props: unknown) =>
    typeof props === "object" && props !== null && "onboarding type" in props;
  const pages = jest.mocked(trackPage).mock.calls.flatMap(([page], index) =>
    isSeeded(page.props)
      ? [
          {
            order: jest.mocked(trackPage).mock.invocationCallOrder[index],
            name: `Page ${page.category}`,
          },
        ]
      : [],
  );
  const events = jest.mocked(track).mock.calls.flatMap(([event, props], index) => {
    if (!isSeeded(props)) return [];
    const button = props && "button" in props ? `: ${String(props.button)}` : "";
    return [
      { order: jest.mocked(track).mock.invocationCallOrder[index], name: `${event}${button}` },
    ];
  });
  return [...pages, ...events].sort((a, b) => a.order - b.order).map(({ name }) => name);
}

/** Hidden screens stay mounted, so a flow left below the next screen would still be found here. */
function expectFlowClosed() {
  expect(
    screen.queryByText("Looking for your Ledger devices", { includeHiddenElements: true }),
  ).toBeNull();
  expect(screen.queryByTestId(checksTestIds.screen, { includeHiddenElements: true })).toBeNull();
}

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
