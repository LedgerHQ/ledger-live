import React, { useEffect } from "react";
import { Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { track } from "@shared/analytics";
import { act, render, screen, waitFor, withFlagOverrides } from "@tests/test-renderer";
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
  type TrustchainMember,
  TrustchainResultType,
} from "@ledgerhq/ledger-key-ring-protocol/types";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import { ScreenName } from "~/const";
import type { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { CONNECTION_TYPES } from "~/analytics/hooks/variables";
import { OnboardingType, type State } from "~/reducers/types";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";
import { ActivationProcess } from "../screens/Activation/ActivationProcess";
import { ManageInstancesProcess } from "../screens/ManageInstances/ManageInstancesProcess";
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

jest.mock("~/components/SelectDevice2", () => {
  const { View } = jest.requireActual("react-native");
  return { __esModule: true, default: () => <View testID="select-device-2" /> };
});

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
    return <Component jobState={jobState} extraProps={undefined} onClose={onUserCancel} />;
  }

  return {
    buildDeviceInitializationInput: jest.fn().mockResolvedValue(INITIALIZATION_INPUT),
    DeviceIntentExecutor: FakeDeviceIntentExecutor,
  };
});

const TRUSTCHAIN: Trustchain = {
  rootId: "rootId",
  applicationPath: "applicationPath",
  walletSyncEncryptionKey: "walletSyncEncryptionKey",
};

const ROTATED_TRUSTCHAIN: Trustchain = { ...TRUSTCHAIN, walletSyncEncryptionKey: "rotated" };

const MEMBER: TrustchainMember = { id: "member-2", name: "Desktop", permissions: 112 };

const MEMBER_CREDENTIALS = { privatekey: "privatekey", pubkey: "pubkey" };

const Stack = createNativeStackNavigator<WalletSyncNavigatorStackParamList>();

function Reached({ route }: { route: { name: string; params?: object } }) {
  return <Text>{`reached ${route.name} ${JSON.stringify(route.params ?? {})}`}</Text>;
}

function ActivationNavigator() {
  return (
    <Stack.Navigator initialRouteName={ScreenName.WalletSyncActivationProcess}>
      <Stack.Screen name={ScreenName.WalletSyncActivationProcess} component={ActivationProcess} />
      <Stack.Screen name={ScreenName.WalletSyncLoading} component={Reached} />
      <Stack.Screen name={ScreenName.WalletSyncManageKeyDeleteSuccess} component={Reached} />
    </Stack.Navigator>
  );
}

function OpenActivation() {
  const navigation = useNavigation<StackNavigatorNavigation<WalletSyncNavigatorStackParamList>>();
  useEffect(() => {
    navigation.navigate(ScreenName.WalletSyncActivationProcess, undefined);
  }, [navigation]);
  return <Text>activation entry</Text>;
}

// Opens the activation over another screen, so a stray goBack shows.
function ActivationOverEntryNavigator() {
  return (
    <Stack.Navigator initialRouteName={ScreenName.WalletSyncActivationInit}>
      <Stack.Screen name={ScreenName.WalletSyncActivationInit} component={OpenActivation} />
      <Stack.Screen name={ScreenName.WalletSyncActivationProcess} component={ActivationProcess} />
      <Stack.Screen name={ScreenName.WalletSyncLoading} component={Reached} />
      <Stack.Screen name={ScreenName.WalletSyncManageKeyDeleteSuccess} component={Reached} />
    </Stack.Navigator>
  );
}

function ManageInstancesNavigator() {
  return (
    <Stack.Navigator initialRouteName={ScreenName.WalletSyncManageInstancesProcess}>
      <Stack.Screen
        name={ScreenName.WalletSyncManageInstancesProcess}
        component={ManageInstancesProcess}
        initialParams={{ member: MEMBER }}
      />
      <Stack.Screen name={ScreenName.WalletSyncManageInstancesSuccess} component={Reached} />
    </Stack.Navigator>
  );
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

// The SDK on a seed without trustchain: it reports no trustchain, then creates one.
async function createOnSeedWithoutTrustchain(
  _deviceId: string,
  _memberCredentials: unknown,
  callbacks: GetOrCreateTrustchainCallbacks,
) {
  callbacks.onInitialResponse?.({});
  return { type: TrustchainResultType.created, trustchain: TRUSTCHAIN };
}

function namedError(ErrorClass: new (message?: string) => Error): Error {
  return new ErrorClass("from the SDK");
}

describe("Ledger Sync device steps on DIE", () => {
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

        const { store } = render(<ActivationNavigator />, {
          overrideInitialState: initialState({}),
        });

        expect(
          await screen.findByText(
            `reached ${ScreenName.WalletSyncLoading} ${JSON.stringify({ created })}`,
          ),
        ).toBeVisible();
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

    it("should pass the current trustchain so the SDK restores it", async () => {
      mockGetOrCreateTrustchain.mockResolvedValue({
        type: TrustchainResultType.restored,
        trustchain: TRUSTCHAIN,
      });

      render(<ActivationNavigator />, {
        overrideInitialState: initialState({ trustchain: TRUSTCHAIN }),
      });

      await screen.findByText(new RegExp(`reached ${ScreenName.WalletSyncLoading}`));
      expect(mockGetOrCreateTrustchain.mock.calls[0][4]).toEqual(TRUSTCHAIN);
    });

    it.each([
      [TrustchainAlreadyInitialized, /This app is already secured by this Ledger/],
      [TrustchainAlreadyInitializedWithOtherSeed, /You can’t use this Ledger to sync/],
      [NoTrustchainInitialized, /Sync not detected/],
      [TrustchainNotAllowed, /Connect the same Ledger device you used for enabling Ledger Sync/],
    ])("should route %p to its existing error scene", async (ErrorClass, title) => {
      mockGetOrCreateTrustchain.mockRejectedValue(namedError(ErrorClass));

      render(<ActivationNavigator />, { overrideInitialState: initialState({}) });

      expect(await screen.findByText(title)).toBeVisible();
    });

    it("should route an unknown error to the generic error", async () => {
      mockGetOrCreateTrustchain.mockRejectedValue(new Error("network down"));

      render(<ActivationNavigator />, { overrideInitialState: initialState({}) });

      expect(await screen.findByText(/network down/)).toBeVisible();
    });

    it("should show the unbacked error when an onboarding syncs with Ledger Sync on a seed without trustchain", async () => {
      mockGetOrCreateTrustchain.mockImplementation(createOnSeedWithoutTrustchain);

      const { store } = render(<ActivationNavigator />, {
        overrideInitialState: initialState({
          hasCompletedOnboarding: false,
          onboardingType: OnboardingType.walletSync,
        }),
      });

      expect(await screen.findByText(/Sync not detected/)).toBeVisible();
      expect(store.getState().trustchain.trustchain).toBeNull();
    });

    it("should create the trustchain on a seed without trustchain once the onboarding is completed", async () => {
      mockGetOrCreateTrustchain.mockImplementation(createOnSeedWithoutTrustchain);

      const { store } = render(<ActivationNavigator />, {
        overrideInitialState: initialState({ onboardingType: OnboardingType.walletSync }),
      });

      expect(
        await screen.findByText(
          `reached ${ScreenName.WalletSyncLoading} ${JSON.stringify({ created: true })}`,
        ),
      ).toBeVisible();
      expect(store.getState().trustchain.trustchain).toEqual(TRUSTCHAIN);
    });

    it("should track the rejection on the device, then succeed on retry", async () => {
      mockGetOrCreateTrustchain
        .mockRejectedValueOnce(new UserRefusedOnDevice())
        .mockResolvedValueOnce({ type: TrustchainResultType.created, trustchain: TRUSTCHAIN });

      const { user } = render(<ActivationNavigator />, {
        overrideInitialState: initialState({}),
      });

      expect(await screen.findByText(/Operation rejected on Ledger device/)).toBeVisible();
      expect(track).toHaveBeenCalledWith(AnalyticsEvents.LedgerSyncRejectedOnDevice, {
        page: "Ledger Sync",
        modelId: "stax",
        connectionType: CONNECTION_TYPES.BLE,
      });

      await user.press(screen.getByTestId("wallet-sync-add-member-retry"));

      expect(
        await screen.findByText(
          `reached ${ScreenName.WalletSyncLoading} ${JSON.stringify({ created: true })}`,
        ),
      ).toBeVisible();
      expect(mockGetOrCreateTrustchain).toHaveBeenCalledTimes(2);
    });

    it("should stay on the activation when Retry closes the unbacked error", async () => {
      mockGetOrCreateTrustchain
        .mockRejectedValueOnce(namedError(NoTrustchainInitialized))
        .mockResolvedValueOnce({ type: TrustchainResultType.created, trustchain: TRUSTCHAIN });

      const { user } = render(<ActivationOverEntryNavigator />, {
        overrideInitialState: initialState({}),
      });

      await user.press(await screen.findByText("Try again"));

      expect(
        await screen.findByText(
          `reached ${ScreenName.WalletSyncLoading} ${JSON.stringify({ created: true })}`,
        ),
      ).toBeVisible();
      expect(mockGetOrCreateTrustchain).toHaveBeenCalledTimes(2);
    });

    it("should keep the delete success screen after deleting the key from the other seed error", async () => {
      mockGetOrCreateTrustchain.mockRejectedValue(
        namedError(TrustchainAlreadyInitializedWithOtherSeed),
      );

      const { user } = render(<ActivationOverEntryNavigator />, {
        overrideInitialState: initialState({}),
      });

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

      const { store } = render(<ActivationNavigator />, {
        overrideInitialState: initialState({ memberCredentials: null }),
      });

      expect(mockGetOrCreateTrustchain).not.toHaveBeenCalled();
      act(() => {
        store.dispatch(setMemberCredentials(MEMBER_CREDENTIALS));
      });

      expect(
        await screen.findByText(
          `reached ${ScreenName.WalletSyncLoading} ${JSON.stringify({ created: true })}`,
        ),
      ).toBeVisible();
    });

    it("should keep the device selection when the flag is off", async () => {
      render(<ActivationNavigator />, {
        overrideInitialState: initialState({ ledgerSyncDie: false }),
      });

      expect(await screen.findByTestId("select-device-2")).toBeVisible();
      expect(mockGetOrCreateTrustchain).not.toHaveBeenCalled();
    });
  });

  describe("instance removal", () => {
    it("should store the rotated trustchain and reach the deletion success", async () => {
      mockRemoveMember.mockResolvedValue(ROTATED_TRUSTCHAIN);

      const { store } = render(<ManageInstancesNavigator />, {
        overrideInitialState: initialState({ trustchain: TRUSTCHAIN }),
      });

      expect(
        await screen.findByText(
          `reached ${ScreenName.WalletSyncManageInstancesSuccess} ${JSON.stringify({ member: MEMBER })}`,
        ),
      ).toBeVisible();
      expect(store.getState().trustchain.trustchain).toEqual(ROTATED_TRUSTCHAIN);
      expect(mockRemoveMember).toHaveBeenCalledWith(
        "compat-1",
        TRUSTCHAIN,
        MEMBER_CREDENTIALS,
        MEMBER,
        expect.any(Object),
      );
    });

    it("should show the unsecured error when the device may not remove the instance", async () => {
      mockRemoveMember.mockRejectedValue(namedError(TrustchainNotAllowed));

      render(<ManageInstancesNavigator />, {
        overrideInitialState: initialState({ trustchain: TRUSTCHAIN }),
      });

      expect(
        await screen.findByText(/Connect the same Ledger device you used for enabling Ledger Sync/),
      ).toBeVisible();
    });

    it("should retry the removal after a rejection on the device", async () => {
      mockRemoveMember
        .mockRejectedValueOnce(new UserRefusedOnDevice())
        .mockResolvedValueOnce(ROTATED_TRUSTCHAIN);

      const { user } = render(<ManageInstancesNavigator />, {
        overrideInitialState: initialState({ trustchain: TRUSTCHAIN }),
      });

      await user.press(await screen.findByTestId("wallet-sync-remove-member-retry"));

      await waitFor(() =>
        expect(
          screen.getByText(new RegExp(`reached ${ScreenName.WalletSyncManageInstancesSuccess}`)),
        ).toBeVisible(),
      );
      expect(mockRemoveMember).toHaveBeenCalledTimes(2);
    });
  });
});
