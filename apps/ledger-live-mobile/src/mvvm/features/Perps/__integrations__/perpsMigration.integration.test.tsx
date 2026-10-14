import React, { useState } from "react";
import { Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Observable, of } from "rxjs";
import type { Account } from "@ledgerhq/types-live";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { Button } from "@ledgerhq/native-ui";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import {
  getWalletApiIdFromAccountId,
  setWalletApiIdForAccountId,
} from "@ledgerhq/live-common/wallet-api/converters";
import { cancelMigrationRequest } from "@ledgerhq/live-common/wallet-api/Perps/migrationRequest";
import {
  act,
  render,
  screen,
  waitFor,
  withFlagOverrides,
  withReadOnlyDisabled,
} from "@tests/test-renderer";
import { NavigatorName, ScreenName } from "~/const";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { State } from "~/reducers/types";
import DeviceSelectionNavigator from "LLM/features/DeviceSelection/Navigator";
import AddAccountsNavigator from "LLM/features/Accounts/Navigator";
import { NotificationsPromptProvider } from "LLM/features/NotificationsPrompt";
import { IsDeviceLockedResultType } from "~/hooks/useIsDeviceLockedPolling/types";
import { usePerpsHandlers } from "../hooks/usePerpsHandlers";

jest.mock("@ledgerhq/live-common/hw/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/hw/index"),
  discoverDevices: jest.fn(() =>
    of({
      type: "add" as const,
      id: "usb|1",
      name: "Ledger Stax",
      deviceModel: { id: DeviceModelId.stax },
      wired: true,
    }),
  ),
}));

jest.mock("~/hooks/deviceActions", () => ({
  __esModule: true,
  useAppDeviceAction: () => {
    const device = { modelId: "stax" as const, deviceId: "usb|1" };
    const appAndVersion = { name: "Ethereum", version: "1.0.0" };
    return {
      useHook: () => ({ device, isLocked: false, opened: true, appAndVersion }),
      mapResult: () => ({ device, appAndVersion }),
    };
  },
}));

jest.mock("~/hooks/useIsDeviceLockedPolling/useIsDeviceLockedPolling", () => ({
  ...jest.requireActual("~/hooks/useIsDeviceLockedPolling/useIsDeviceLockedPolling"),
  useIsDeviceLockedPolling: () => ({
    result: { type: IsDeviceLockedResultType.unlocked },
    retry: jest.fn(),
  }),
}));

let triggerNext: (account: Account) => void = () => null;
let triggerComplete: () => void = () => null;

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  __esModule: true,
  getCurrencyBridge: () => {
    const bridge = {
      scanAccounts: () =>
        new Observable<{ account: Account }>(subscriber => {
          triggerNext = account => subscriber.next({ account });
          triggerComplete = () => subscriber.complete();
        }),
      preload: () => Promise.resolve(true),
      hydrate: () => true,
    };
    return Object.assign(Promise.resolve(bridge), { status: "fulfilled", value: bridge });
  },
  getAccountBridge: () => {
    const accountBridge = { isAccountEmpty: () => false };
    return Object.assign(Promise.resolve(accountBridge), {
      status: "fulfilled",
      value: accountBridge,
    });
  },
}));

const legacyAccount = genAccount("perps-legacy", { currency: getCryptoCurrencyById("arbitrum") });
const discoveredAccount = genAccount("perps-hc-discovered", {
  currency: getCryptoCurrencyById("hypercore"),
});

const MIGRATE = "Migrate";
const Stack = createNativeStackNavigator<BaseNavigatorStackParamList>();

/** Stands in for the Perps live app: calls the wallet API method and prints the outcome. */
function PerpsScreen() {
  const handlers = usePerpsHandlers([legacyAccount]);
  const [outcome, setOutcome] = useState("pending");

  const migrate = () => {
    const migrateAccount = handlers["custom.perps.migrateAccount"] as (req: {
      params: { legacyAccountId: string };
    }) => Promise<{ accounts: { accountId: string; created: boolean }[] }>;
    migrateAccount({
      params: { legacyAccountId: getWalletApiIdFromAccountId(legacyAccount.id) },
    }).then(
      result => setOutcome(JSON.stringify(result)),
      (error: Error) => setOutcome(error.name),
    );
  };

  return (
    <>
      <Button type="main" onPress={migrate}>
        {MIGRATE}
      </Button>
      <Text testID="migration-outcome">{outcome}</Text>
    </>
  );
}

function Harness() {
  return (
    <NotificationsPromptProvider>
      <Stack.Navigator initialRouteName={ScreenName.MockedModularDrawer}>
        <Stack.Screen name={ScreenName.MockedModularDrawer} component={PerpsScreen} />
        <Stack.Screen
          name={NavigatorName.DeviceSelection}
          component={DeviceSelectionNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={NavigatorName.AddAccounts}
          component={AddAccountsNavigator}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NotificationsPromptProvider>
  );
}

const overrideInitialState = (state: State) =>
  withFlagOverrides({})(withReadOnlyDisabled({ ...state, accounts: { active: [legacyAccount] } }));

const advanceTimers = () => act(() => jest.advanceTimersByTime(500));

async function connectDeviceAndScan(user: ReturnType<typeof render>["user"]) {
  await user.press(screen.getByText(MIGRATE));
  advanceTimers();
  await user.press(screen.getByText(/ledger stax/i));
  advanceTimers();
  await waitFor(() => expect(screen.getByText(/checking the blockchain/i)).toBeVisible());
  await act(() => triggerNext(discoveredAccount));
  await act(() => triggerComplete());
}

describe("Perps migration integration", () => {
  beforeAll(() => setWalletApiIdForAccountId(legacyAccount.id));
  afterEach(() => cancelMigrationRequest());

  it("adds the selected Hyperliquid account and returns to Perps on Done", async () => {
    const { user, store } = render(<Harness />, { overrideInitialState });

    await connectDeviceAndScan(user);
    expect(screen.getByText(/confirm/i)).toBeDisabled();

    await user.press(screen.getAllByText(/hyperliquid/i).at(-1)!);
    await user.press(screen.getByText(/confirm/i));

    await waitFor(() =>
      expect(
        screen.getByTestId("migration-outcome", { includeHiddenElements: true }),
      ).toHaveTextContent(
        JSON.stringify({
          accounts: [
            { accountId: getWalletApiIdFromAccountId(discoveredAccount.id), created: true },
          ],
        }),
      ),
    );
    expect(store.getState().accounts.active.map((a: Account) => a.id)).toContain(
      discoveredAccount.id,
    );

    await user.press(screen.getByText(/^done$/i));
    expect(screen.getByText(MIGRATE)).toBeVisible();
  });

  it("cancels when the user leaves before adding anything", async () => {
    const { user, store } = render(<Harness />, { overrideInitialState });

    await connectDeviceAndScan(user);
    // Back to the Perps screen through the header close, as a device error would do too.
    await user.press(screen.getAllByTestId(/NavigationHeaderCloseButton/i).at(-1)!);
    advanceTimers();
    await user.press(screen.getAllByText(/^cancel$/i).at(-1)!);
    advanceTimers();

    await waitFor(() =>
      expect(
        screen.getByTestId("migration-outcome", { includeHiddenElements: true }),
      ).toHaveTextContent("UserRefusedOnDevice"),
    );
    expect(store.getState().accounts.active).toHaveLength(1);
  });
});
