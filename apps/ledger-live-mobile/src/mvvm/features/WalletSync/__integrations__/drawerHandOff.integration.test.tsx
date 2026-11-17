import React, { useState } from "react";
import { Text, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within, withFlagOverrides } from "@tests/test-renderer";
import type { TrustchainMember } from "@ledgerhq/ledger-key-ring-protocol/types";
import { NavigatorName, ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";
import ActivationDrawer from "../screens/Activation/ActivationDrawer";
import ManageInstancesDrawer from "../screens/ManageInstances/ManageInstancesDrawer";
import { useManageInstancesDrawer } from "../screens/ManageInstances/useManageInstanceDrawer";
import ManageKeyDrawer from "../screens/ManageKey/ManageKeyDrawer";
import { useManageKeyDrawer } from "../screens/ManageKey/useManageKeyDrawer";
import { ErrorType } from "../hooks/type.hooks";
import { Steps } from "../types/Activation";

// The drawer only reports its dismissal when the test says its close animation ended.
jest.mock("LLM/components/QueuedDrawer", () => {
  const { Text: TextActual, View: ViewActual } =
    jest.requireActual<typeof import("react-native")>("react-native");
  function FakeQueuedDrawer({
    isRequestingToBeOpened,
    onClose,
    onModalHide,
    children,
  }: Readonly<{
    isRequestingToBeOpened?: boolean;
    onClose?: () => void;
    onModalHide?: () => void;
    children?: React.ReactNode;
  }>) {
    return (
      <ViewActual>
        {isRequestingToBeOpened ? (
          <>
            {children}
            <TextActual onPress={onClose}>close drawer</TextActual>
          </>
        ) : null}
        <TextActual onPress={onModalHide}>drawer hidden</TextActual>
      </ViewActual>
    );
  }
  return { __esModule: true, default: FakeQueuedDrawer };
});

jest.mock("../deviceIntents/LedgerSyncIntentStepLWM", () => {
  const { Text: TextActual } = jest.requireActual<typeof import("react-native")>("react-native");
  return { LedgerSyncIntentStepLWM: () => <TextActual>device step</TextActual> };
});

jest.mock("../hooks/useInitMemberCredentials", () => ({
  useInitMemberCredentials: () => ({
    memberCredentials: null,
    generateMemberCredentials: jest.fn(),
  }),
}));

jest.mock("../hooks/useDestroyTrustchain", () => ({
  useDestroyTrustchain: () => ({
    deleteMutation: {
      isPending: false,
      error: new Error(ErrorType.NO_TRUSTCHAIN),
      mutateAsync: jest.fn(),
    },
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

const ENTRY = "Entry";

type TestStackParamList = { [ENTRY]: undefined; [NavigatorName.WalletSync]: undefined };

const RootStack = createNativeStackNavigator<TestStackParamList>();
const WalletSyncStack = createNativeStackNavigator<WalletSyncNavigatorStackParamList>();

function Reached({ route }: { route: { name: string } }) {
  return <Text>{`reached ${route.name}`}</Text>;
}

function withEntry(Entry: React.ComponentType) {
  return function EntryNavigator() {
    return (
      <QueryClientProvider client={new QueryClient()}>
        <RootStack.Navigator initialRouteName={ENTRY}>
          <RootStack.Screen name={ENTRY} component={Entry} />
          <RootStack.Screen name={NavigatorName.WalletSync}>
            {() => (
              <WalletSyncStack.Navigator>
                <WalletSyncStack.Screen
                  name={ScreenName.WalletSyncActivationProcess}
                  component={Reached}
                />
                <WalletSyncStack.Screen
                  name={ScreenName.WalletSyncManageInstancesProcess}
                  component={Reached}
                />
              </WalletSyncStack.Navigator>
            )}
          </RootStack.Screen>
        </RootStack.Navigator>
      </QueryClientProvider>
    );
  };
}

const ActivationEntry = withEntry(function ActivationEntryScreen() {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <View>
      <ActivationDrawer
        startingStep={Steps.ChooseSyncMethod}
        isOpen={isOpen}
        handleClose={() => setIsOpen(false)}
      />
    </View>
  );
});

const ManageInstancesEntry = withEntry(function ManageInstancesEntryScreen() {
  const manageInstances = useManageInstancesDrawer();
  const { openDrawer } = manageInstances;
  React.useEffect(openDrawer, [openDrawer]);
  return (
    <View>
      <ManageInstancesDrawer {...manageInstances} />
      {manageInstances.deviceIntentStepElement}
    </View>
  );
});

const ManageKeyEntry = withEntry(function ManageKeyEntryScreen() {
  const manageKey = useManageKeyDrawer();
  return (
    <View>
      <ManageKeyDrawer {...manageKey} />
      {manageKey.deviceIntentStepElement}
    </View>
  );
});

function initialState({ ledgerSyncDie = true }: { ledgerSyncDie?: boolean } = {}) {
  return withFlagOverrides(
    {
      llmWalletSync: { enabled: true, params: { environment: "STAGING", watchConfig: {} } },
      lwmLedgerSyncDie: { enabled: ledgerSyncDie },
    },
    (state: State) => ({
      ...state,
      settings: { ...state.settings, readOnlyModeEnabled: false },
      walletSync: { ...state.walletSync, isManageKeyDrawerOpen: true },
    }),
  );
}

function expectNoDeviceStep() {
  expect(screen.queryByText("device step")).toBeNull();
}

function expectDrawerClosed() {
  expect(screen.queryByText("close drawer")).toBeNull();
}

describe("Ledger Sync drawers handing off to a device step", () => {
  describe("activation", () => {
    it("should start the device step only once the drawer is hidden", async () => {
      const { user } = render(<ActivationEntry />, { overrideInitialState: initialState() });

      await user.press(await screen.findByTestId("walletsync-choose-sync-method-connect-device"));

      expectDrawerClosed();
      expectNoDeviceStep();

      await user.press(screen.getByText("drawer hidden"));

      expect(await screen.findByText("device step")).toBeVisible();
    });

    it("should start nothing when the drawer is closed without choosing the device", async () => {
      const { user } = render(<ActivationEntry />, { overrideInitialState: initialState() });

      await user.press(await screen.findByText("close drawer"));
      await user.press(screen.getByText("drawer hidden"));

      expectDrawerClosed();
      expectNoDeviceStep();
    });

    it("should navigate to the activation screen when the flag is off", async () => {
      const { user } = render(<ActivationEntry />, {
        overrideInitialState: initialState({ ledgerSyncDie: false }),
      });

      await user.press(await screen.findByTestId("walletsync-choose-sync-method-connect-device"));

      expect(
        await screen.findByText(`reached ${ScreenName.WalletSyncActivationProcess}`),
      ).toBeVisible();
      expectNoDeviceStep();
    });
  });

  describe("instance removal", () => {
    async function pressRemove(user: ReturnType<typeof render>["user"]) {
      const instance = await screen.findByTestId(`walletSync-manage-instance-${MEMBER.id}`);
      await user.press(within(instance).getByText("Remove"));
    }

    it("should start the removal step only once the drawer is hidden", async () => {
      const { user } = render(<ManageInstancesEntry />, { overrideInitialState: initialState() });

      await pressRemove(user);

      expectDrawerClosed();
      expectNoDeviceStep();

      await user.press(screen.getByText("drawer hidden"));

      expect(await screen.findByText("device step")).toBeVisible();
    });

    it("should start nothing when the drawer is closed without removing an instance", async () => {
      const { user } = render(<ManageInstancesEntry />, { overrideInitialState: initialState() });

      await user.press(await screen.findByText("close drawer"));
      await user.press(screen.getByText("drawer hidden"));

      expectDrawerClosed();
      expectNoDeviceStep();
    });
  });

  describe("key management", () => {
    it("should start the activation step only once the drawer is hidden", async () => {
      const { user } = render(<ManageKeyEntry />, { overrideInitialState: initialState() });

      await user.press(await screen.findByText("Turn on Ledger Sync"));

      expectDrawerClosed();
      expectNoDeviceStep();

      await user.press(screen.getByText("drawer hidden"));

      expect(await screen.findByText("device step")).toBeVisible();
    });

    it("should start nothing when the drawer is closed without turning on Ledger Sync", async () => {
      const { user } = render(<ManageKeyEntry />, { overrideInitialState: initialState() });

      await user.press(await screen.findByText("close drawer"));
      await user.press(screen.getByText("drawer hidden"));

      expectDrawerClosed();
      expectNoDeviceStep();
    });
  });
});
