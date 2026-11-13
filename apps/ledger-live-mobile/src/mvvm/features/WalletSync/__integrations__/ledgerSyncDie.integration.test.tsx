import React, { useState } from "react";
import { BackHandler, Text, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { track } from "@shared/analytics";
import { act, render, screen, waitFor, within, withFlagOverrides } from "@tests/test-renderer";
import type { ExecutorState } from "@features/platform-device-intent";
import type { LedgerSyncJobState } from "@features/platform-intent-wallet-sync";
import { setMemberCredentials } from "@ledgerhq/ledger-key-ring-protocol/store";
import {
  NoTrustchainInitialized,
  TrustchainAlreadyInitialized,
  TrustchainAlreadyInitializedWithOtherSeed,
  TrustchainNotAllowed,
} from "@ledgerhq/ledger-key-ring-protocol/errors";
import {
  type GetOrCreateTrustchainCallbacks,
  type Trustchain,
  type TrustchainDeviceCallbacks,
  type TrustchainMember,
  TrustchainResultType,
} from "@ledgerhq/ledger-key-ring-protocol/types";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import AddAccountDrawer from "LLM/features/Accounts/screens/AddAccount";
import { useLedgerSyncActivationStepViewModel } from "LLM/features/Onboarding/screens/SyncOnboardingCompanion/components/LedgerSyncActivationStep/useLedgerSyncActivationStepViewModel";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { NavigatorName, ScreenName } from "~/const";
import { CONNECTION_TYPES } from "~/analytics/hooks/variables";
import { OnboardingType, type State } from "~/reducers/types";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";
import ActivationDrawer from "../screens/Activation/ActivationDrawer";
import ManageInstancesDrawer from "../screens/ManageInstances/ManageInstancesDrawer";
import { useManageInstancesDrawer } from "../screens/ManageInstances/useManageInstanceDrawer";
import { Steps } from "../types/Activation";
import { AnalyticsEvents } from "../Analytics/enums";

const mockGetOrCreateTrustchain = jest.fn();
const mockRemoveMember = jest.fn();

jest.mock("../deviceIntents/useCreateSessionSdk", () => ({
  useCreateSessionSdk: () => () => ({
    getOrCreateTrustchain: mockGetOrCreateTrustchain,
    removeMember: mockRemoveMember,
  }),
}));

jest.mock("../hooks/useDestroyTrustchain", () => ({
  useDestroyTrustchain: () => ({ deleteMutation: { mutateAsync: jest.fn() } }),
}));

// The tests create the member credentials themselves.
jest.mock("../hooks/useInitMemberCredentials", () => ({
  useInitMemberCredentials: () => ({
    memberCredentials: null,
    generateMemberCredentials: jest.fn(),
  }),
}));

const MEMBER: TrustchainMember = { id: "member-2", name: "Desktop", permissions: 112 };

jest.mock("../hooks/useGetMembers", () => ({
  useGetMembers: () => ({
    isLoading: false,
    data: [MEMBER],
    isError: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

type FakeExecutorProps = Readonly<{
  intent: {
    job: (params: object) => {
      subscribe: (observer: object) => { unsubscribe: () => void };
    };
    input: unknown;
    onResult?: (result: unknown) => void;
    component: React.ComponentType<{
      jobState: LedgerSyncJobState | undefined;
      extraProps: undefined;
      onClose: () => void;
    }>;
  };
  onUserCancel: () => void;
  onExecutorStateChanged: (executorState: ExecutorState) => void;
  onIntentJobStateChanged?: (jobState: LedgerSyncJobState) => void;
}>;

// Runs the real job and renderer on a fake session, in place of the connection and the app setup.
jest.mock("LLM/components/DeviceIntentExecutor", () => {
  const ReactActual = jest.requireActual<typeof React>("react");
  const { View: ViewActual } = jest.requireActual<typeof import("react-native")>("react-native");
  const { buildDeviceConnection, EXTRACTED_CONTEXT, INITIALIZATION_INPUT } = jest.requireActual<
    typeof import("../deviceIntents/__tests__/ledgerSyncIntentTestKit")
  >("../deviceIntents/__tests__/ledgerSyncIntentTestKit");

  function FakeDeviceIntentExecutor({
    intent,
    onUserCancel,
    onExecutorStateChanged,
    onIntentJobStateChanged,
  }: FakeExecutorProps) {
    const [jobState, setJobState] = ReactActual.useState<LedgerSyncJobState | undefined>();

    ReactActual.useEffect(() => {
      const connectionResult = buildDeviceConnection("session-1");
      const executorState: Extract<ExecutorState, { type: "executingIntent" }> = {
        type: "executingIntent",
        connectionResult,
        extractedContext: EXTRACTED_CONTEXT,
      };
      onExecutorStateChanged(executorState);
      const subscription = intent
        .job({
          deviceConnectionResult: connectionResult,
          deviceExtractedContext: EXTRACTED_CONTEXT,
          input: intent.input,
          onResult: (result: unknown) => intent.onResult?.(result),
        })
        .subscribe({
          next: (state: LedgerSyncJobState) => {
            setJobState(state);
            onIntentJobStateChanged?.(state);
          },
        });
      return () => subscription.unsubscribe();
    }, []); // oxlint-disable-line react-hooks/exhaustive-deps

    const Component = intent.component;
    return (
      <ViewActual testID="device-intent-sheet">
        <Component jobState={jobState} extraProps={undefined} onClose={onUserCancel} />
      </ViewActual>
    );
  }

  return {
    buildDeviceInitializationInput: jest.fn().mockResolvedValue(INITIALIZATION_INPUT),
    DeviceIntentExecutor: FakeDeviceIntentExecutor,
  };
});

// Android hardware Back: the last listener added runs first, until one handles it.
type BackListener = () => boolean | null | undefined;
let backListeners: BackListener[] = [];
jest.spyOn(BackHandler, "addEventListener").mockImplementation((_event, listener) => {
  backListeners.push(listener);
  return {
    remove: () => {
      backListeners = backListeners.filter(other => other !== listener);
    },
  };
});

function pressBack() {
  act(() => {
    for (const listener of [...backListeners].reverse()) {
      if (listener()) return;
    }
  });
}

const TRUSTCHAIN: Trustchain = {
  rootId: "rootId",
  applicationPath: "applicationPath",
  walletSyncEncryptionKey: "walletSyncEncryptionKey",
};

const ROTATED_TRUSTCHAIN: Trustchain = { ...TRUSTCHAIN, walletSyncEncryptionKey: "rotated" };

const MEMBER_CREDENTIALS = { privatekey: "privatekey", pubkey: "pubkey" };

const ENTRY = "Entry";

type TestStackParamList = { [ENTRY]: undefined; [NavigatorName.WalletSync]: undefined };

const RootStack = createNativeStackNavigator<TestStackParamList>();
const WalletSyncStack = createNativeStackNavigator<WalletSyncNavigatorStackParamList>();

function Reached({ route }: { route: { name: string; params?: object } }) {
  return <Text>{`reached ${route.name} ${JSON.stringify(route.params ?? {})}`}</Text>;
}

const WALLET_SYNC_SCREENS = [
  ScreenName.WalletSyncActivationProcess,
  ScreenName.WalletSyncManageInstancesProcess,
  ScreenName.WalletSyncLoading,
  ScreenName.WalletSyncManageKeyDeleteSuccess,
  ScreenName.WalletSyncManageInstancesSuccess,
] as const;

function WalletSyncScreens({ Manage }: Readonly<{ Manage?: React.ComponentType }>) {
  return (
    <WalletSyncStack.Navigator>
      {Manage ? (
        <WalletSyncStack.Screen name={ScreenName.WalletSyncActivated} component={Manage} />
      ) : null}
      {WALLET_SYNC_SCREENS.map(name => (
        <WalletSyncStack.Screen key={name} name={name} component={Reached} />
      ))}
    </WalletSyncStack.Navigator>
  );
}

function withEntry(Entry: React.ComponentType) {
  return function EntryNavigator() {
    return (
      <QueryClientProvider client={new QueryClient()}>
        <RootStack.Navigator initialRouteName={ENTRY}>
          <RootStack.Screen name={ENTRY} component={Entry} />
          <RootStack.Screen name={NavigatorName.WalletSync}>
            {() => <WalletSyncScreens />}
          </RootStack.Screen>
        </RootStack.Navigator>
      </QueryClientProvider>
    );
  };
}

// Opens the entry as the Ledger Sync settings screen, inside the Ledger Sync stack.
function withLedgerSyncSettingsEntry(Entry: React.ComponentType) {
  return function LedgerSyncSettingsNavigator() {
    return (
      <QueryClientProvider client={new QueryClient()}>
        <RootStack.Navigator initialRouteName={NavigatorName.WalletSync}>
          <RootStack.Screen name={NavigatorName.WalletSync}>
            {() => <WalletSyncScreens Manage={Entry} />}
          </RootStack.Screen>
        </RootStack.Navigator>
      </QueryClientProvider>
    );
  };
}

// Ledger Sync settings and the onboarding "Access existing wallet" open this drawer.
const SettingsEntry = withEntry(function SettingsEntryScreen() {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <View>
      <Text>entry screen</Text>
      <ActivationDrawer
        startingStep={Steps.ChooseSyncMethod}
        isOpen={isOpen}
        handleClose={() => setIsOpen(false)}
      />
    </View>
  );
});

const AddAccountEntry = withEntry(function AddAccountEntryScreen() {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <View>
      <Text>entry screen</Text>
      <AddAccountDrawer isOpened={isOpen} onClose={() => setIsOpen(false)} />
    </View>
  );
});

const ManageInstancesEntry = withLedgerSyncSettingsEntry(function ManageInstancesEntryScreen() {
  const manageInstances = useManageInstancesDrawer();
  const { openDrawer } = manageInstances;
  React.useEffect(openDrawer, [openDrawer]);
  return (
    <View>
      <Text>entry screen</Text>
      <ManageInstancesDrawer {...manageInstances} />
      {manageInstances.deviceIntentStepElement}
    </View>
  );
});

// The onboarding companion step: it marks the activation as coming from the onboarding.
const CompanionEntry = withEntry(function CompanionEntryScreen() {
  const companion = useLedgerSyncActivationStepViewModel({
    handleContinue: jest.fn(),
    isLedgerSyncActive: false,
    device: { deviceId: "device-1" } as Device,
    analyticsSeedConfiguration: { current: "new_seed" },
  });
  return (
    <View>
      <Text>entry screen</Text>
      <Text onPress={companion.handleSyncContinue}>sync with ledger sync</Text>
      {companion.deviceIntentStepElement}
    </View>
  );
});

async function activateFromCompanion(): Promise<RenderResult> {
  const result = render(<CompanionEntry />, {
    overrideInitialState: initialState({ hasCompletedOnboarding: false }),
  });
  await result.user.press(await screen.findByText("sync with ledger sync"));
  return result;
}

function initialState({
  ledgerSyncDie = true,
  trustchain = null,
  hasCompletedOnboarding = true,
  onboardingType = OnboardingType.restore,
  memberCredentials = MEMBER_CREDENTIALS,
}: {
  ledgerSyncDie?: boolean;
  trustchain?: Trustchain | null;
  hasCompletedOnboarding?: boolean;
  onboardingType?: OnboardingType;
  memberCredentials?: typeof MEMBER_CREDENTIALS | null;
}) {
  return withFlagOverrides(
    {
      llmWalletSync: { enabled: true, params: { environment: "STAGING", watchConfig: {} } },
      lwmLedgerSyncDie: { enabled: ledgerSyncDie },
    },
    (state: State) => ({
      ...state,
      settings: {
        ...state.settings,
        readOnlyModeEnabled: false,
        hasCompletedOnboarding,
        onboardingType,
      },
      trustchain: { ...state.trustchain, trustchain, memberCredentials },
    }),
  );
}

type RenderResult = ReturnType<typeof render>;

async function activateFromSettings(state = initialState({})): Promise<RenderResult> {
  const result = render(<SettingsEntry />, { overrideInitialState: state });
  await result.user.press(
    await screen.findByTestId("walletsync-choose-sync-method-connect-device"),
  );
  return result;
}

async function removeInstance(
  state = initialState({ trustchain: TRUSTCHAIN }),
): Promise<RenderResult> {
  const result = render(<ManageInstancesEntry />, { overrideInitialState: state });
  const instance = await screen.findByTestId(`walletSync-manage-instance-${MEMBER.id}`);
  await result.user.press(within(instance).getByText("Remove"));
  return result;
}

function loadingScreen(created: boolean) {
  return `reached ${ScreenName.WalletSyncLoading} ${JSON.stringify({ created })}`;
}

function expectNoProcessScreen() {
  expect(screen.queryByText(/reached WalletSyncActivationProcess/)).toBeNull();
  expect(screen.queryByText(/reached WalletSyncManageInstancesProcess/)).toBeNull();
}

// Waits for the device step to close, then returns the entry screen the user stayed on.
async function waitForEntryScreen() {
  await waitFor(() => expect(screen.queryByTestId("device-intent-sheet")).toBeNull());
  expectNoProcessScreen();
  return screen.getByText("entry screen");
}

// The SDK on a seed without trustchain: it reports no trustchain, then creates one.
async function createOnSeedWithoutTrustchain(
  _deviceId: string,
  _memberCredentials: unknown,
  callbacks: GetOrCreateTrustchainCallbacks,
) {
  callbacks.onInitialResponse?.({});
  return { type: TrustchainResultType.created, trustchain: TRUSTCHAIN };
}

// The SDK waiting for the user's confirmation on the device.
function awaitConfirmationForever(
  _deviceId: string,
  _memberCredentials: unknown,
  callbacks: TrustchainDeviceCallbacks,
) {
  callbacks.onStartRequestUserInteraction?.();
  return new Promise(() => {});
}

function namedError(ErrorClass: new (message?: string) => Error): Error {
  return new ErrorClass("from the SDK");
}

describe("Ledger Sync device steps on DIE, opened over the entry screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("activation", () => {
    it.each([
      [TrustchainResultType.created, true],
      [TrustchainResultType.updated, false],
      [TrustchainResultType.restored, false],
    ])(
      "should store the trustchain and reach the loading screen when it is %s",
      async (type, created) => {
        mockGetOrCreateTrustchain.mockResolvedValue({ type, trustchain: TRUSTCHAIN });

        const { store } = await activateFromSettings();

        expect(await screen.findByText(loadingScreen(created))).toBeVisible();
        expectNoProcessScreen();
        expect(store.getState().trustchain.trustchain).toEqual(TRUSTCHAIN);
        expect(mockGetOrCreateTrustchain).toHaveBeenCalledWith(
          "compat-1",
          MEMBER_CREDENTIALS,
          expect.objectContaining({ onInitialResponse: expect.any(Function) }),
          undefined,
          undefined,
        );
        expect(track).toHaveBeenCalledWith(AnalyticsEvents.LedgerSyncActivated, {
          flow: "Ledger Sync",
        });
      },
    );

    it("should open the device step over the entry screen", async () => {
      mockGetOrCreateTrustchain.mockImplementation(awaitConfirmationForever);

      await activateFromSettings();

      expect(await screen.findByTestId("wallet-sync-add-member-continue-on-device")).toBeVisible();
      expect(screen.getByText("entry screen")).toBeVisible();
      expectNoProcessScreen();
    });

    it("should pass the current trustchain so the SDK restores it", async () => {
      mockGetOrCreateTrustchain.mockResolvedValue({
        type: TrustchainResultType.restored,
        trustchain: TRUSTCHAIN,
      });

      await activateFromSettings(initialState({ trustchain: TRUSTCHAIN }));

      await screen.findByText(loadingScreen(false));
      expect(mockGetOrCreateTrustchain.mock.calls[0][4]).toEqual(TRUSTCHAIN);
    });

    it("should run from Add account and reach the loading screen", async () => {
      mockGetOrCreateTrustchain.mockResolvedValue({
        type: TrustchainResultType.created,
        trustchain: TRUSTCHAIN,
      });

      const { user } = render(<AddAccountEntry />, { overrideInitialState: initialState({}) });
      await user.press(await screen.findByTestId("add-accounts-modal-wallet-sync-button"));
      await user.press(await screen.findByTestId("walletsync-choose-sync-method-connect-device"));

      expect(await screen.findByText(loadingScreen(true))).toBeVisible();
      expectNoProcessScreen();
    });

    it.each([
      [TrustchainAlreadyInitialized, /This app is already secured by this Ledger/],
      [TrustchainAlreadyInitializedWithOtherSeed, /You can’t use this Ledger to sync/],
      [NoTrustchainInitialized, /Sync not detected/],
      [TrustchainNotAllowed, /Connect the same Ledger device you used for enabling Ledger Sync/],
    ])("should route %p to its existing error scene", async (ErrorClass, title) => {
      mockGetOrCreateTrustchain.mockRejectedValue(namedError(ErrorClass));

      await activateFromSettings();

      expect(await screen.findByText(title)).toBeVisible();
      expectNoProcessScreen();
    });

    it("should route an unknown error to the generic error", async () => {
      mockGetOrCreateTrustchain.mockRejectedValue(new Error("network down"));

      await activateFromSettings();

      expect(await screen.findByText(/network down/)).toBeVisible();
    });

    it("should stay on the entry screen when the error drawer is closed", async () => {
      mockGetOrCreateTrustchain.mockRejectedValue(new Error("network down"));

      const { user } = await activateFromSettings();
      await screen.findByText(/network down/);
      await user.press(screen.getByTestId("modal-close-button"));

      await waitFor(() => expect(screen.queryByText(/network down/)).toBeNull());
      expect(await waitForEntryScreen()).toBeVisible();
    });

    it("should show the unbacked error when an onboarding syncs with Ledger Sync on a seed without trustchain", async () => {
      mockGetOrCreateTrustchain.mockImplementation(createOnSeedWithoutTrustchain);

      const { store } = await activateFromSettings(
        initialState({ hasCompletedOnboarding: false, onboardingType: OnboardingType.walletSync }),
      );

      expect(await screen.findByText(/Sync not detected/)).toBeVisible();
      expect(store.getState().trustchain.trustchain).toBeNull();
    });

    it("should create the trustchain on a seed without trustchain once the onboarding is completed", async () => {
      mockGetOrCreateTrustchain.mockImplementation(createOnSeedWithoutTrustchain);

      const { store } = await activateFromSettings(
        initialState({ onboardingType: OnboardingType.walletSync }),
      );

      expect(await screen.findByText(loadingScreen(true))).toBeVisible();
      expect(store.getState().trustchain.trustchain).toEqual(TRUSTCHAIN);
    });

    it("should track the rejection on the device, then succeed on retry", async () => {
      mockGetOrCreateTrustchain
        .mockRejectedValueOnce(new UserRefusedOnDevice())
        .mockResolvedValueOnce({ type: TrustchainResultType.created, trustchain: TRUSTCHAIN });

      const { user } = await activateFromSettings();

      expect(await screen.findByText(/Operation rejected on Ledger device/)).toBeVisible();
      expect(track).toHaveBeenCalledWith(AnalyticsEvents.LedgerSyncRejectedOnDevice, {
        page: "Ledger Sync",
        modelId: "stax",
        connectionType: CONNECTION_TYPES.BLE,
      });

      await user.press(screen.getByTestId("wallet-sync-add-member-retry"));

      expect(await screen.findByText(loadingScreen(true))).toBeVisible();
      expect(mockGetOrCreateTrustchain).toHaveBeenCalledTimes(2);
    });

    it("should stay on the entry screen when the rejection is closed", async () => {
      mockGetOrCreateTrustchain.mockRejectedValue(new UserRefusedOnDevice());

      const { user } = await activateFromSettings();
      await user.press(await screen.findByTestId("wallet-sync-add-member-close"));

      expect(await waitForEntryScreen()).toBeVisible();
    });

    it("should drop the onboarding marker when the companion step is closed without activating", async () => {
      mockGetOrCreateTrustchain.mockRejectedValue(new UserRefusedOnDevice());

      const { store, user } = await activateFromCompanion();
      expect(store.getState().settings.fromLedgerSyncOnboarding).toBe(true);
      await user.press(await screen.findByTestId("wallet-sync-add-member-close"));

      expect(await waitForEntryScreen()).toBeVisible();
      expect(store.getState().settings.fromLedgerSyncOnboarding).toBe(false);
    });

    it("should keep the onboarding marker when the companion step activates", async () => {
      mockGetOrCreateTrustchain.mockResolvedValue({
        type: TrustchainResultType.created,
        trustchain: TRUSTCHAIN,
      });

      const { store } = await activateFromCompanion();

      expect(await screen.findByText(loadingScreen(true))).toBeVisible();
      expect(store.getState().settings.fromLedgerSyncOnboarding).toBe(true);
    });

    it("should run again when Retry closes the unbacked error", async () => {
      mockGetOrCreateTrustchain
        .mockRejectedValueOnce(namedError(NoTrustchainInitialized))
        .mockResolvedValueOnce({ type: TrustchainResultType.created, trustchain: TRUSTCHAIN });

      const { user } = await activateFromSettings();
      await user.press(await screen.findByText("Try again"));

      expect(await screen.findByText(loadingScreen(true))).toBeVisible();
      expect(mockGetOrCreateTrustchain).toHaveBeenCalledTimes(2);
    });

    it("should keep the delete success screen after deleting the key from the other seed error", async () => {
      mockGetOrCreateTrustchain.mockRejectedValue(
        namedError(TrustchainAlreadyInitializedWithOtherSeed),
      );

      const { user } = await activateFromSettings();
      await user.press(await screen.findByText("Delete my encryption key"));
      await user.press(await screen.findByTestId("delete-trustchain"));

      const deleteSuccess = `reached ${ScreenName.WalletSyncManageKeyDeleteSuccess} {}`;
      expect(await screen.findByText(deleteSuccess)).toBeVisible();
      await act(async () => {});
      expect(screen.getByText(deleteSuccess)).toBeVisible();
    });

    it("should start the activation once the member credentials are created", async () => {
      mockGetOrCreateTrustchain.mockResolvedValue({
        type: TrustchainResultType.created,
        trustchain: TRUSTCHAIN,
      });

      const { store } = await activateFromSettings(initialState({ memberCredentials: null }));

      expect(mockGetOrCreateTrustchain).not.toHaveBeenCalled();
      act(() => {
        store.dispatch(setMemberCredentials(MEMBER_CREDENTIALS));
      });

      expect(await screen.findByText(loadingScreen(true))).toBeVisible();
    });

    it("should navigate to the activation screen when the flag is off", async () => {
      await activateFromSettings(initialState({ ledgerSyncDie: false }));

      expect(
        await screen.findByText(`reached ${ScreenName.WalletSyncActivationProcess} {}`),
      ).toBeVisible();
      expect(mockGetOrCreateTrustchain).not.toHaveBeenCalled();
    });
  });

  describe("Android Back", () => {
    it("should close the device step when it is dismissable", async () => {
      mockGetOrCreateTrustchain.mockRejectedValue(new UserRefusedOnDevice());

      await activateFromSettings();
      await screen.findByTestId("wallet-sync-add-member-rejected");

      pressBack();

      expect(await waitForEntryScreen()).toBeVisible();
    });

    it("should be ignored while the device confirmation locks the step", async () => {
      mockGetOrCreateTrustchain.mockImplementation(awaitConfirmationForever);

      const { store } = await activateFromSettings();
      await screen.findByTestId("wallet-sync-add-member-continue-on-device");
      await waitFor(() => expect(store.getState().appstate.modalLock).toBe(true));

      pressBack();

      expect(screen.getByTestId("wallet-sync-add-member-continue-on-device")).toBeVisible();
      expect(screen.getByText("entry screen")).toBeVisible();
      expectNoProcessScreen();
    });
  });

  describe("instance removal", () => {
    it("should store the rotated trustchain and reach the deletion success", async () => {
      mockRemoveMember.mockResolvedValue(ROTATED_TRUSTCHAIN);

      const { store } = await removeInstance();

      expect(
        await screen.findByText(
          `reached ${ScreenName.WalletSyncManageInstancesSuccess} ${JSON.stringify({ member: MEMBER })}`,
        ),
      ).toBeVisible();
      expectNoProcessScreen();
      expect(store.getState().trustchain.trustchain).toEqual(ROTATED_TRUSTCHAIN);
      expect(mockRemoveMember).toHaveBeenCalledWith(
        "compat-1",
        TRUSTCHAIN,
        MEMBER_CREDENTIALS,
        MEMBER,
        expect.any(Object),
      );
    });

    it("should stay on the entry screen when the error of a run that could not start is closed", async () => {
      const { user } = await removeInstance(initialState({ trustchain: null }));

      await user.press(await screen.findByTestId("modal-close-button"));

      await waitFor(() => expect(screen.queryByTestId("modal-close-button")).toBeNull());
      expect(await waitForEntryScreen()).toBeVisible();
      expect(mockRemoveMember).not.toHaveBeenCalled();
    });

    it("should show the unsecured error when the device may not remove the instance", async () => {
      mockRemoveMember.mockRejectedValue(namedError(TrustchainNotAllowed));

      await removeInstance();

      expect(
        await screen.findByText(/Connect the same Ledger device you used for enabling Ledger Sync/),
      ).toBeVisible();
    });

    it("should retry the removal after a rejection on the device", async () => {
      mockRemoveMember
        .mockRejectedValueOnce(new UserRefusedOnDevice())
        .mockResolvedValueOnce(ROTATED_TRUSTCHAIN);

      const { user } = await removeInstance();
      await user.press(await screen.findByTestId("wallet-sync-remove-member-retry"));

      expect(
        await screen.findByText(
          new RegExp(`reached ${ScreenName.WalletSyncManageInstancesSuccess}`),
        ),
      ).toBeVisible();
      expect(mockRemoveMember).toHaveBeenCalledTimes(2);
    });

    it("should navigate to the removal screen when the flag is off", async () => {
      await removeInstance(initialState({ ledgerSyncDie: false, trustchain: TRUSTCHAIN }));

      expect(
        await screen.findByText(
          `reached ${ScreenName.WalletSyncManageInstancesProcess} ${JSON.stringify({ member: MEMBER })}`,
        ),
      ).toBeVisible();
      expect(mockRemoveMember).not.toHaveBeenCalled();
    });
  });
});
