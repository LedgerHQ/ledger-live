import React from "react";
import BigNumber from "bignumber.js";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { fireEvent, render, screen, waitFor } from "@tests/test-renderer";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { NotEnoughBalance, AmountRequired } from "@ledgerhq/ledger-wallet-framework/errors";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import { NavigatorName, ScreenName } from "~/const";
import { NotificationsPromptProvider } from "LLM/features/NotificationsPrompt";
import { makeAleoAccount } from "../../__mocks__/account.mock";
import {
  aleoAccountBridge,
  mockTransactionStatus,
  resetAleoBridgeMock,
} from "../../__mocks__/bridge.mock";
import { component as UnbondFlowNavigator } from "../index";

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
jest.mock(
  "@ledgerhq/live-common/bridge/index",
  () => require("../../__mocks__/bridge.mock").aleoBridgeModule,
);

jest.mock("~/datadog", () => ({
  isDatadogEnabled: false,
  initializeDatadogProvider: jest.fn(),
  customErrorEventMapper: jest.fn(),
  customActionEventMapper: jest.fn(),
  customLogEventMapper: jest.fn(),
  viewNamePredicate: jest.fn(),
  broadcastLogger: jest.fn(),
}));

jest.setTimeout(30_000);

const CREDIT = 1_000_000;

const VALIDATOR_ADDRESS = "aleo1q3vx8pet0h7739hx5xlekfxh9kus6qdlxhx9qdkxhh9rnva8q5gsskve3t";

const Stack = createNativeStackNavigator();

function UnbondFlowHarness() {
  return (
    <NotificationsPromptProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name={NavigatorName.AleoUnbondFlow} component={UnbondFlowNavigator} />
      </Stack.Navigator>
    </NotificationsPromptProvider>
  );
}

const BONDED_ACCOUNT = makeAleoAccount({
  transparentBalance: new BigNumber(50_000 * CREDIT),
  bondedBalance: new BigNumber(12_000 * CREDIT),
  bondedValidator: VALIDATOR_ADDRESS,
});

function renderFlowAt(account: AleoAccount) {
  return render(<UnbondFlowHarness />, {
    navigationInitialState: {
      index: 0,
      routes: [
        {
          name: NavigatorName.AleoUnbondFlow,
          state: {
            index: 0,
            routes: [{ name: ScreenName.AleoUnbondAmount, params: { accountId: account.id } }],
          },
        },
      ],
    },
    overrideInitialState: state => ({
      ...state,
      accounts: { ...state.accounts, active: [account] },
    }),
  });
}

describe("Aleo unbond flow (integration)", () => {
  beforeEach(() => {
    resetAleoBridgeMock({
      operationType: "UNBOND",
    });
  });

  it("walks Amount → device → success for a full unbond, showing the bonded amount", async () => {
    const { user } = renderFlowAt(BONDED_ACCOUNT);

    await waitFor(() =>
      expect(screen.getByTestId("aleo-unbond-amount-value")).toHaveTextContent("12,000 ALEO"),
    );
    const continueButton = screen.getByTestId("aleo-unbond-amount-continue");
    await waitFor(() => expect(continueButton).toBeEnabled());

    expect(aleoAccountBridge.updateTransaction).toHaveBeenCalledWith(expect.anything(), {
      mode: TRANSACTION_TYPE.UNBOND_PUBLIC,
      useAllAmount: true,
    });

    await user.press(continueButton);

    await user.press(await screen.findByTestId("device-item-mock"));

    await waitFor(() => expect(screen.getByTestId("validate-success-screen")).toBeVisible(), {
      timeout: 10_000,
    });
  });

  it("explains the freeze period and that unbonding below the minimum stake unbonds the full balance", async () => {
    renderFlowAt(BONDED_ACCOUNT);

    await waitFor(() =>
      expect(screen.getByTestId("aleo-unbond-below-minimum-alert")).toHaveTextContent(
        /frozen for about 360 blocks.*less than 10,000 ALEO bonded.*entire bonded balance is unbonded/,
      ),
    );
  });

  it("turns off Max to enable a partial amount, and back on to use the full bonded balance", async () => {
    renderFlowAt(BONDED_ACCOUNT);

    const maxToggle = await screen.findByTestId("aleo-unbond-use-all-amount");
    expect(screen.getByTestId("aleo-unbond-amount-input")).toBeDisabled();

    fireEvent(maxToggle, "valueChange", false);

    await waitFor(() =>
      expect(aleoAccountBridge.updateTransaction).toHaveBeenCalledWith(expect.anything(), {
        amount: new BigNumber(0),
        useAllAmount: false,
      }),
    );
    await waitFor(() => expect(screen.getByTestId("aleo-unbond-amount-input")).toBeEnabled());

    fireEvent(maxToggle, "valueChange", true);

    await waitFor(() =>
      expect(aleoAccountBridge.updateTransaction).toHaveBeenCalledWith(expect.anything(), {
        amount: new BigNumber(0),
        useAllAmount: true,
      }),
    );
    await waitFor(() => expect(screen.getByTestId("aleo-unbond-amount-input")).toBeDisabled());
  });

  it("disables Continue when there is nothing to unbond", async () => {
    mockTransactionStatus({
      amount: new BigNumber(0),
      errors: { amount: new AmountRequired() },
    });

    const noPosition = makeAleoAccount({
      transparentBalance: new BigNumber(50_000 * CREDIT),
      bondedBalance: new BigNumber(0),
      bondedValidator: null,
    });

    renderFlowAt(noPosition);

    await waitFor(() => expect(screen.getByTestId("aleo-unbond-amount-continue")).toBeDisabled());
  });

  it("renders NotEnoughBalance from the fees key and disables Continue on a fee shortfall", async () => {
    mockTransactionStatus({
      amount: new BigNumber(12_000 * CREDIT),
      errors: { fees: new NotEnoughBalance() },
    });

    renderFlowAt(BONDED_ACCOUNT);

    await waitFor(() => expect(screen.getByText("Sorry, insufficient funds")).toBeVisible());
    expect(screen.getByTestId("aleo-unbond-amount-continue")).toBeDisabled();
  });
});
