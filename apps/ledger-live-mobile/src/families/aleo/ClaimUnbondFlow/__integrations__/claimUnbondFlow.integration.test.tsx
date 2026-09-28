import React from "react";
import BigNumber from "bignumber.js";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { render, screen, waitFor } from "@tests/test-renderer";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { AleoNoClaimableUnbondedFunds } from "@ledgerhq/live-common/families/aleo/errors";
import { NotEnoughBalance } from "@ledgerhq/ledger-wallet-framework/errors";
import { NavigatorName, ScreenName } from "~/const";
import { NotificationsPromptProvider } from "LLM/features/NotificationsPrompt";
import { makeAleoAccount } from "../../__mocks__/account.mock";
import {
  aleoAccountBridge,
  mockTransactionStatus,
  resetAleoBridgeMock,
} from "../../__mocks__/bridge.mock";
import { component as ClaimUnbondFlowNavigator } from "../index";

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

const CLAIMABLE = new BigNumber(5_000 * CREDIT);

const CLAIM_TRANSACTION = {
  family: "aleo" as const,
  mode: "claim_unbond_public",
  amount: new BigNumber(0),
  recipient: "",
  useAllAmount: false,
};

const Stack = createNativeStackNavigator();

function ClaimFlowHarness() {
  return (
    <NotificationsPromptProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name={NavigatorName.AleoClaimUnbondFlow}
          component={ClaimUnbondFlowNavigator}
        />
      </Stack.Navigator>
    </NotificationsPromptProvider>
  );
}

const CLAIMABLE_ACCOUNT = makeAleoAccount(
  {
    transparentBalance: new BigNumber(10 * CREDIT),
    unbondingBalance: CLAIMABLE,
    unbondingHeight: 10_000,
  },
  { blockHeight: 10_000 },
);

const UNMATURED_ACCOUNT = makeAleoAccount(
  {
    transparentBalance: new BigNumber(10 * CREDIT),
    unbondingBalance: CLAIMABLE,
    unbondingHeight: 50_000,
  },
  { blockHeight: 49_000 },
);

function renderAmountStep(account: AleoAccount = CLAIMABLE_ACCOUNT) {
  return render(<ClaimFlowHarness />, {
    navigationInitialState: {
      index: 0,
      routes: [
        {
          name: NavigatorName.AleoClaimUnbondFlow,
          state: {
            index: 0,
            routes: [{ name: ScreenName.AleoClaimUnbondAmount, params: { accountId: account.id } }],
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

describe("Aleo claim unbond flow (integration)", () => {
  beforeEach(() => {
    resetAleoBridgeMock({
      transaction: CLAIM_TRANSACTION,
      operationType: "WITHDRAW_UNBONDED",
    });
    mockTransactionStatus({ amount: new BigNumber(0) });
  });

  it("walks Amount → device → success", async () => {
    const { user } = renderAmountStep();

    const continueButton = await screen.findByTestId("aleo-claim-amount-continue");
    await waitFor(() => expect(continueButton).toBeEnabled());
    await user.press(continueButton);

    await user.press(await screen.findByTestId("device-item-mock"));

    expect(await screen.findByTestId("device-action-loading")).toBeVisible();
    await waitFor(() => expect(screen.getByTestId("validate-success-screen")).toBeVisible(), {
      timeout: 5_000,
    });
  });

  it("builds a claim transaction the account signs for itself", async () => {
    renderAmountStep();

    await waitFor(() =>
      expect(aleoAccountBridge.updateTransaction).toHaveBeenCalledWith(expect.anything(), {
        mode: "claim_unbond_public",
        recipient: CLAIMABLE_ACCOUNT.freshAddress,
      }),
    );
  });

  it("shows the claimable amount without letting it be edited", async () => {
    renderAmountStep();

    const input = await screen.findByTestId("aleo-claim-amount-input");
    expect(input).toHaveDisplayValue("5,000");
    expect(input).toBeDisabled();
  });

  it("explains what a claim does", async () => {
    renderAmountStep();

    expect(
      await screen.findByText(
        "This claims all ALEO whose unbonding period has elapsed back to your account.",
      ),
    ).toBeVisible();
  });

  it("blocks Continue when nothing has finished unbonding, and says why", async () => {
    mockTransactionStatus({
      amount: new BigNumber(0),
      errors: { amount: new AleoNoClaimableUnbondedFunds() },
    });

    renderAmountStep(UNMATURED_ACCOUNT);

    expect(await screen.findByText("No unbonded ALEO to claim yet")).toBeVisible();
    expect(screen.getByTestId("aleo-claim-amount-input")).toHaveDisplayValue("");
    await waitFor(() => expect(screen.getByTestId("aleo-claim-amount-continue")).toBeDisabled());
  });

  it("prefers the claim error over a fee error raised on the same screen", async () => {
    mockTransactionStatus({
      amount: new BigNumber(0),
      errors: { fees: new NotEnoughBalance(), amount: new AleoNoClaimableUnbondedFunds() },
    });

    renderAmountStep(
      makeAleoAccount(
        {
          transparentBalance: new BigNumber(0),
          unbondingBalance: CLAIMABLE,
          unbondingHeight: 50_000,
        },
        { blockHeight: 49_000 },
      ),
    );

    expect(await screen.findByText("No unbonded ALEO to claim yet")).toBeVisible();
    expect(screen.queryByText("Sorry, insufficient funds")).toBeNull();
  });
});
