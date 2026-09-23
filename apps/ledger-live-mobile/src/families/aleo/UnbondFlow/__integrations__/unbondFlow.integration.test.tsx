import React from "react";
import BigNumber from "bignumber.js";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { render, screen, waitFor } from "@tests/test-renderer";
import type { AleoAccount, AleoValidator } from "@ledgerhq/live-common/families/aleo/types";
import { NotEnoughBalance, AmountRequired } from "@ledgerhq/ledger-wallet-framework/errors";
import { NavigatorName, ScreenName } from "~/const";
import { NotificationsPromptProvider } from "LLM/features/NotificationsPrompt";
import { makeAleoAccount, withFreshCurrencyId } from "../../__mocks__/account.mock";
import { mockTransactionStatus, resetAleoBridgeMock } from "../../__mocks__/bridge.mock";
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

// Mocked here and not at useAleoValidators, which useAleoStakingPosition calls as a same-module
// closure jest.mock cannot intercept. Virtual because coin-aleo is live-common's dependency, not
// live-mobile's, so it has no type declarations here.
jest.mock(
  "@ledgerhq/coin-aleo/logic",
  () => ({
    getValidators: jest.fn(),
    isDelegatorBelowMinimum: () => false,
  }),
  { virtual: true },
);

type GetValidatorsMock = jest.Mock<Promise<AleoValidator[]>, [string]>;
const mockGetValidators: GetValidatorsMock = (
  jest.requireMock("@ledgerhq/coin-aleo/logic") as { getValidators: GetValidatorsMock }
).getValidators;

jest.setTimeout(30_000);

const CREDIT = 1_000_000;

const VALIDATOR_ADDRESS = "aleo1q3vx8pet0h7739hx5xlekfxh9kus6qdlxhx9qdkxhh9rnva8q5gsskve3t";

const UNBOND_TRANSACTION = {
  family: "aleo" as const,
  mode: "unbond_public",
  amount: new BigNumber(12_000 * CREDIT),
  recipient: "",
  useAllAmount: true,
  subAccountId: undefined,
};

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
      transaction: UNBOND_TRANSACTION,
      operationType: "UNBOND",
    });
    mockGetValidators.mockResolvedValue([]);
  });

  it("walks Amount → device → success for a full unbond, showing the bonded amount", async () => {
    const { user } = renderFlowAt(BONDED_ACCOUNT);

    await waitFor(() =>
      expect(screen.getByTestId("aleo-unbond-amount-value")).toHaveTextContent("12,000 ALEO"),
    );
    const continueButton = screen.getByTestId("aleo-unbond-amount-continue");
    await waitFor(() => expect(continueButton).toBeEnabled());
    await user.press(continueButton);

    await user.press(await screen.findByTestId("device-item-mock"));

    await waitFor(() => expect(screen.getByTestId("validate-success-screen")).toBeVisible(), {
      timeout: 10_000,
    });
  });

  it("explains the freeze period and that a separate claim is needed", async () => {
    renderFlowAt(BONDED_ACCOUNT);

    await waitFor(() =>
      expect(screen.getByTestId("aleo-unbond-freeze-alert")).toHaveTextContent(
        /360 blocks.*claim it separately/,
      ),
    );
  });

  it("makes clear re-staking with another validator does not require claiming first", async () => {
    renderFlowAt(BONDED_ACCOUNT);

    await waitFor(() => expect(screen.getByTestId("aleo-unbond-restake-alert")).toBeVisible());
    expect(screen.queryByText(/must claim/i)).toBeNull();
  });

  it("disables Continue and shows no bonded position when there is nothing to unbond", async () => {
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

    await waitFor(() =>
      expect(screen.getByText("Please make sure the account has enough funds.")).toBeVisible(),
    );
    expect(screen.getByTestId("aleo-unbond-amount-continue")).toBeDisabled();
  });

  describe("Validator", () => {
    it("shows a loading skeleton, not the bare address, before the committee fetch resolves", async () => {
      let resolveValidators!: (validators: AleoValidator[]) => void;
      mockGetValidators.mockReturnValue(
        new Promise(resolve => {
          resolveValidators = resolve;
        }),
      );

      renderFlowAt(withFreshCurrencyId(BONDED_ACCOUNT));

      await waitFor(() => expect(screen.getByTestId("aleo-unbond-amount-value")).toBeVisible());
      expect(screen.queryByTestId("aleo-unbond-amount-validator")).toBeNull();

      resolveValidators([]);

      await waitFor(() =>
        expect(screen.getByTestId("aleo-unbond-amount-validator")).toHaveTextContent(
          VALIDATOR_ADDRESS,
        ),
      );
    });

    it("shows the validator's name once the committee fetch resolves", async () => {
      mockGetValidators.mockResolvedValue([
        {
          address: VALIDATOR_ADDRESS,
          name: "Figment",
          isOpen: true,
          isUnbonding: false,
          commissionPercent: 10,
          stakeMicrocredits: 1_000_000_000,
        } as AleoValidator,
      ]);

      renderFlowAt(withFreshCurrencyId(BONDED_ACCOUNT));

      await waitFor(() =>
        expect(screen.getByTestId("aleo-unbond-amount-validator")).toHaveTextContent("Figment"),
      );
    });

    it("falls back to the bonded address, without blocking Continue, when the committee fetch fails", async () => {
      mockGetValidators.mockRejectedValue(new Error("boom"));

      const { user } = renderFlowAt(withFreshCurrencyId(BONDED_ACCOUNT));

      await waitFor(() =>
        expect(screen.getByTestId("aleo-unbond-amount-validator")).toHaveTextContent(
          VALIDATOR_ADDRESS,
        ),
      );
      const continueButton = screen.getByTestId("aleo-unbond-amount-continue");
      await waitFor(() => expect(continueButton).toBeEnabled());
      await user.press(continueButton);

      expect(await screen.findByTestId("device-item-mock")).toBeVisible();
    });
  });
});
