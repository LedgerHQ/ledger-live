import React from "react";
import { Observable, Subject } from "rxjs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { Account } from "@ledgerhq/types-live";
import { act, render, screen, waitFor, withReadOnlyDisabled } from "@tests/test-renderer";
import { NavigatorName } from "~/const";
import DeviceSelectionNavigator from "LLM/features/DeviceSelection/Navigator";
import AddAccountsNavigator from "LLM/features/Accounts/Navigator";
import { AddAccountContexts } from "LLM/features/Accounts/screens/AddAccount/enums";
import { ALEO_ACCOUNT_1, ALEO_ACCOUNT_2 } from "../../__mocks__/account.mock";
import { aleoCurrency } from "../../__mocks__/currency.mock";

// ScanDeviceAccounts only ever surfaces a single "creatable" (used: false) account at a time —
// mark these as already-used so both land in the "importable" section and can be selected together.
const USED_ALEO_ACCOUNT_1 = { ...ALEO_ACCOUNT_1, used: true };
const USED_ALEO_ACCOUNT_2 = { ...ALEO_ACCOUNT_2, used: true };

jest.mock(
  "@ledgerhq/live-common/hw/actions/app",
  () => require("../../__mocks__/deviceConnection.mock").hwActionsAppModule,
);

jest.mock(
  "@ledgerhq/live-common/hw/index",
  () => require("../../__mocks__/deviceConnection.mock").hwIndexModule,
);

jest.mock(
  "~/hooks/useIsDeviceLockedPolling/useIsDeviceLockedPolling",
  () => require("../../__mocks__/deviceConnection.mock").deviceLockedPollingModule,
);

// getViewKeyExec runs inside withDevice(device.deviceId)(transport => getViewKeyExec(transport, request));
// bypassing transport creation lets the mocked getViewKeyExec below run without a real device.
jest.mock("@ledgerhq/live-common/hw/deviceAccess", () => ({
  ...jest.requireActual("@ledgerhq/live-common/hw/deviceAccess"),
  withDevice: () => (job: (transport: undefined) => Observable<unknown>) => job(undefined),
}));

let triggerNext: (accounts: Account[]) => void = () => null;
let triggerComplete: () => void = () => null;

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  __esModule: true,
  getCurrencyBridge: () => {
    const bridge = {
      scanAccounts: () =>
        new Observable<{ account: Account }>(subscriber => {
          triggerNext = accounts => accounts.forEach(account => subscriber.next({ account }));
          triggerComplete = () => subscriber.complete();
        }),
      preload: () => Promise.resolve(true),
      hydrate: () => true,
    };
    return Object.assign(Promise.resolve(bridge), { status: "fulfilled" as const, value: bridge });
  },
  getAccountBridge: () => {
    const accountBridge = {
      isAccountEmpty: (a: Account) => a.operationsCount === 0 && a.balance.isZero(),
    };
    return Object.assign(Promise.resolve(accountBridge), {
      status: "fulfilled" as const,
      value: accountBridge,
    });
  },
}));

let progress$: Subject<{
  viewKeys: Record<string, string | null>;
  completed: number;
  total: number;
}>;

jest.mock("@ledgerhq/live-common/families/aleo/hw/getViewKey/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/families/aleo/hw/getViewKey/index"),
  getViewKeyExec: jest.fn(() => progress$.asObservable()),
}));

const mockScanAccountsSubscription = async (accounts: Account[]) => {
  for (let i = 0; i < accounts.length; i++) {
    await act(() => triggerNext(accounts.slice(0, i + 1)));
  }
  await act(() => triggerComplete());
};

const mockViewKeyProgressSubscription = async (
  steps: { accountId: string; viewKey: string | null }[],
) => {
  const total = steps.length;
  const viewKeys: Record<string, string | null> = {};

  for (const [index, step] of steps.entries()) {
    if (step.viewKey !== null) {
      viewKeys[step.accountId] = step.viewKey;
    }

    await act(async () => {
      progress$.next({ viewKeys, completed: index + 1, total });
    });
  }

  await act(async () => {
    progress$.complete();
  });
};

const advanceTimers = () =>
  act(() => {
    jest.advanceTimersByTime(600);
  });

const Stack = createNativeStackNavigator();

function AleoAddAccountFlowHarness() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name={NavigatorName.DeviceSelection}
        component={DeviceSelectionNavigator}
        initialParams={{ currency: aleoCurrency, context: AddAccountContexts.AddAccounts }}
      />
      <Stack.Screen name={NavigatorName.AddAccounts} component={AddAccountsNavigator} />
    </Stack.Navigator>
  );
}

// Shared by every scenario below: connect the device, accept the view-key warning, let the
// scan surface the given accounts, then request their view keys. Each test only differs in
// how it resolves the subsequent view-key progress.
async function connectDeviceAndScan(accounts: Account[]): Promise<void> {
  const { user } = render(<AleoAddAccountFlowHarness />, {
    overrideInitialState: withReadOnlyDisabled,
  });

  const deviceItem = await screen.findByText(/ledger stax/i);
  await user.press(deviceItem);
  advanceTimers();

  expect(await screen.findByTestId("aleo-view-key-warning-screen")).toBeVisible();
  await user.press(screen.getByTestId("aleo-view-key-warning-allow-button"));

  await waitFor(() => expect(screen.getByText(/checking the blockchain/i)).toBeVisible());
  await mockScanAccountsSubscription(accounts);

  await user.press(await screen.findByText(/^Share view keys?$/));
  expect(await screen.findByTestId("aleo-view-key-approve-screen")).toBeVisible();
}

describe("Aleo add-account flow (integration)", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    progress$ = new Subject();
  });

  afterEach(() => {
    progress$.complete();
    jest.useRealTimers();
  });

  it("walks warning → allow → scan → approve → success when all view keys are confirmed", async () => {
    await connectDeviceAndScan([USED_ALEO_ACCOUNT_1, USED_ALEO_ACCOUNT_2]);

    expect(screen.getByText("Approve on your Ledger")).toBeVisible();

    await mockViewKeyProgressSubscription([
      { accountId: ALEO_ACCOUNT_1.id, viewKey: "vk_1" },
      { accountId: ALEO_ACCOUNT_2.id, viewKey: "vk_2" },
    ]);

    await waitFor(() =>
      expect(screen.getByText("2 Accounts added to your portfolio")).toBeVisible(),
    );
    expect(screen.getByTestId("added-accounts-list")).toBeVisible();
  });

  it("shows the 'no accounts added' screen when every view key is rejected", async () => {
    await connectDeviceAndScan([USED_ALEO_ACCOUNT_1, USED_ALEO_ACCOUNT_2]);

    await mockViewKeyProgressSubscription([
      { accountId: ALEO_ACCOUNT_1.id, viewKey: null },
      { accountId: ALEO_ACCOUNT_2.id, viewKey: null },
    ]);

    expect(await screen.findByText("No Aleo accounts were added")).toBeVisible();
  });

  it("adds only the confirmed accounts when some view keys are rejected", async () => {
    await connectDeviceAndScan([USED_ALEO_ACCOUNT_1, USED_ALEO_ACCOUNT_2]);

    await mockViewKeyProgressSubscription([
      { accountId: ALEO_ACCOUNT_1.id, viewKey: "vk_1" },
      { accountId: ALEO_ACCOUNT_2.id, viewKey: null },
    ]);

    await waitFor(() => expect(screen.getByText("Account added to your portfolio")).toBeVisible());
  });
});
