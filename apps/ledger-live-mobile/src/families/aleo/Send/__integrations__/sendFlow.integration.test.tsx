import React from "react";
import { Observable } from "rxjs";
import BigNumber from "bignumber.js";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { AccountLike, SignOperationEvent } from "@ledgerhq/types-live";
import { act, render, screen, waitFor } from "@tests/test-renderer";
import { NavigatorName, ScreenName } from "~/const";
import SendFundsNavigator from "~/components/RootNavigator/SendFundsNavigator";
import { NotificationsPromptProvider } from "LLM/features/NotificationsPrompt";
import { ALEO_ACCOUNT_1 } from "../../__mocks__/account.mock";
import type { useAleoPrivateSync } from "../../hooks/useAleoPrivateSync";

type PrivateSyncState = ReturnType<typeof useAleoPrivateSync>;

let setPrivateSyncState: ((state: PrivateSyncState) => void) | null = null;

// A stateful mock (backed by real useState) so the test can push new sync progress
// imperatively via setPrivateSyncState, the same way the real live-common hook would
// re-render MandatoryPrivateSyncScreen as sync progresses.
jest.mock("../../hooks/useAleoPrivateSync", () => {
  const { useState } = require("react") as typeof import("react");
  return {
    useAleoPrivateSync: () => {
      const [state, setState] = useState<PrivateSyncState>({
        isSyncing: true,
        progress: 0,
        error: null,
        start: () => {},
        stop: () => {},
      });
      setPrivateSyncState = setState;
      return state;
    },
  };
});

jest.mock(
  "@ledgerhq/live-common/hw/actions/app",
  () => require("../../__mocks__/deviceConnection.mock").hwActionsAppModule,
);

jest.mock(
  "@ledgerhq/live-common/hw/index",
  () => require("../../__mocks__/deviceConnection.mock").hwIndexModule,
);

// SelectDevice2 performs a device-locked check by default before calling onSelect —
// without this, pressing a device item never advances past the select-device screen.
jest.mock(
  "~/hooks/useIsDeviceLockedPolling/useIsDeviceLockedPolling",
  () => require("../../__mocks__/deviceConnection.mock").deviceLockedPollingModule,
);

// The Datadog native module isn't initialized in the test environment.
jest.mock("~/datadog", () => ({
  ...jest.requireActual("~/datadog"),
  broadcastLogger: () => {},
}));

const mockSignedOperation = {
  signature: "sig",
  operation: {
    id: "op-1",
    hash: "0xabc",
    type: "OUT",
    value: new BigNumber(0),
    fee: new BigNumber(0),
    senders: [],
    recipients: [],
    blockHeight: null,
    blockHash: null,
    accountId: ALEO_ACCOUNT_1.id,
    date: new Date(),
    extra: {},
  },
  expirationDate: null,
};

const mockAccountBridge = {
  createTransaction: (_account: AccountLike) => ({
    family: "aleo" as const,
    mode: "transfer_public",
    amount: new BigNumber(0),
    recipient: "",
    useAllAmount: false,
    subAccountId: undefined,
  }),
  updateTransaction: (tx: object, patch: object) => ({ ...tx, ...patch }),
  prepareTransaction: async (_account: AccountLike, tx: unknown) => tx,
  getTransactionStatus: async () => ({
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber(1000),
    amount: new BigNumber(1_000_000),
    totalSpent: new BigNumber(1_001_000),
  }),
  estimateMaxSpendable: async () => new BigNumber(100_000_000),
  getStuckAccountAndOperation: () => null,
  isAccountEmpty: () => false,
  signOperation: () =>
    new Observable<SignOperationEvent>(subscriber => {
      subscriber.next({ type: "device-signature-requested" });
      subscriber.next({ type: "device-signature-granted" });
      subscriber.next({ type: "signed", signedOperation: mockSignedOperation as never });
      subscriber.complete();
    }),
  broadcast: async ({ signedOperation }: { signedOperation: typeof mockSignedOperation }) =>
    signedOperation.operation,
};

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  __esModule: true,
  getAccountBridge: () =>
    Object.assign(Promise.resolve(mockAccountBridge), {
      status: "fulfilled" as const,
      value: mockAccountBridge,
    }),
  getCurrencyBridge: () => {
    const currencyBridge = {
      preload: () => Promise.resolve(true),
      hydrate: () => true,
    };
    return Object.assign(Promise.resolve(currencyBridge), {
      status: "fulfilled" as const,
      value: currencyBridge,
    });
  },
}));

const Stack = createNativeStackNavigator();

function SendFlowHarness() {
  return (
    <NotificationsPromptProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name={NavigatorName.SendFunds} component={SendFundsNavigator} />
      </Stack.Navigator>
    </NotificationsPromptProvider>
  );
}

function makeInitialState(isSelfTransfer: boolean) {
  return {
    index: 0,
    routes: [
      {
        name: NavigatorName.SendFunds,
        state: {
          index: 0,
          routes: [
            {
              name: ScreenName.AleoSendBalanceSelection,
              params: { account: ALEO_ACCOUNT_1, parentAccount: undefined, isSelfTransfer },
            },
          ],
        },
      },
    ],
  };
}

function renderSendFlow(isSelfTransfer: boolean) {
  return render(<SendFlowHarness />, {
    navigationInitialState: makeInitialState(isSelfTransfer),
    overrideInitialState: state => ({
      ...state,
      accounts: { ...state.accounts, active: [ALEO_ACCOUNT_1] },
    }),
  });
}

describe("Aleo send flow (integration)", () => {
  beforeEach(() => {
    setPrivateSyncState = null;
  });

  it("sends publicly through recipient → amount → summary → device → success when private sync is not required", async () => {
    const { user } = renderSendFlow(false);

    await user.press(await screen.findByText("Public"));
    await user.press(screen.getByText("Send publicly"));

    const recipientInput = await screen.findByTestId("recipient-input");
    await user.type(
      recipientInput,
      "aleo1qtd0z6qch67pyzt0yqz9rteyclc8mgz7zwqqqz3lvvxvcmsprsqqjfp2y8",
    );
    await waitFor(() =>
      expect(screen.getByTestId("enabled-recipient-continue-button")).toBeVisible(),
    );
    await user.press(screen.getByTestId("enabled-recipient-continue-button"));

    // `~/components/Button` prefixes every testID with "enabled-"/"disabled-" based on its
    // disabled state, so match the suffix rather than depending on which prefix is currently set.
    await waitFor(() =>
      expect(screen.getByTestId(/^enabled-amount-continue-button/)).toBeVisible(),
    );
    await user.press(screen.getByTestId(/^enabled-amount-continue-button/));

    await waitFor(() => expect(screen.getByTestId(/summary-continue-button$/)).toBeVisible());
    await user.press(screen.getByTestId(/summary-continue-button$/));

    const deviceItem = await screen.findByTestId("device-item-usb|1");
    await user.press(deviceItem);

    await waitFor(() => expect(screen.getByTestId("validate-success-screen")).toBeVisible(), {
      timeout: 10000,
    });
  });

  it("blocks at the mandatory private sync screen and only proceeds once syncing completes", async () => {
    const { user } = renderSendFlow(true);

    await user.press(await screen.findByText("Private"));
    await user.press(screen.getByText("Transfer from private"));

    expect(await screen.findByText(/Syncing your private balance/i)).toBeVisible();
    expect(screen.queryByTestId("amount-input")).toBeNull();

    await act(async () => {
      setPrivateSyncState?.({
        isSyncing: false,
        progress: 100,
        error: null,
        start: () => {},
        stop: () => {},
      });
    });

    await waitFor(() => expect(screen.getByTestId("amount-input")).toBeVisible(), {
      timeout: 5000,
    });
  });

  it("routes a private send to a different recipient through the private sync gate via navigateAfterRecipient", async () => {
    const { user } = renderSendFlow(false);

    await user.press(await screen.findByText("Private"));
    await user.press(screen.getByText("Send privately"));

    const recipientInput = await screen.findByTestId("recipient-input");
    await user.type(
      recipientInput,
      "aleo1qtd0z6qch67pyzt0yqz9rteyclc8mgz7zwqqqz3lvvxvcmsprsqqjfp2y8",
    );
    await waitFor(() =>
      expect(screen.getByTestId("enabled-recipient-continue-button")).toBeVisible(),
    );
    await user.press(screen.getByTestId("enabled-recipient-continue-button"));

    // Unlike the self-transfer case, this reaches the sync gate via
    // customSendFlow.navigateAfterRecipient, not BalanceSelectionScreen directly.
    expect(await screen.findByText(/Syncing your private balance/i)).toBeVisible();
    expect(screen.queryByTestId("amount-input")).toBeNull();
  });
});
