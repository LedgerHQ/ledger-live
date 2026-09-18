import React from "react";
import BigNumber from "bignumber.js";
import { TextInput } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { fireEvent, render, screen, waitFor } from "@tests/test-renderer";
import { shortAddressPreview } from "@ledgerhq/live-common/account/index";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { MIN_DELEGATOR_STAKE_MICROCREDITS } from "@ledgerhq/live-common/families/aleo/constants";
import {
  AleoAlreadyBondedElsewhere,
  AleoBondAmountTooLow,
  AleoClosedValidator,
  AleoStakeAmountTooLow,
  AleoUnbondingValidator,
} from "@ledgerhq/live-common/families/aleo/errors";
import { AmountRequired, NotEnoughBalance } from "@ledgerhq/ledger-wallet-framework/errors";
import { NavigatorName, ScreenName } from "~/const";
import { NotificationsPromptProvider } from "LLM/features/NotificationsPrompt";
import { makeAleoAccount } from "../../__mocks__/account.mock";
import {
  aleoAccountBridge,
  mockTransactionStatus,
  resetAleoBridgeMock,
} from "../../__mocks__/bridge.mock";
import { component as BondPublicFlowNavigator } from "../index";

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

const mockUseAleoValidators = jest.fn();
const mockRefetch = jest.fn();
jest.mock("@ledgerhq/live-common/families/aleo/react", () => ({
  useAleoValidators: (...args: unknown[]) => mockUseAleoValidators(...args),
}));

jest.setTimeout(30_000);

const CREDIT = 1_000_000;

// The mainnet default from the currency configuration, pre-selected by the picker.
const VALIDATOR_ADDRESS = "aleo1q3vx8pet0h7739hx5xlekfxh9kus6qdlxhx9qdkxhh9rnva8q5gsskve3t";

const BOND_AMOUNT = new BigNumber(MIN_DELEGATOR_STAKE_MICROCREDITS);

const BOND_TRANSACTION = {
  family: "aleo" as const,
  mode: "bond_public",
  amount: BOND_AMOUNT,
  recipient: VALIDATOR_ADDRESS,
  useAllAmount: false,
  subAccountId: undefined,
};

const MOCK_VALIDATORS = [
  {
    address: VALIDATOR_ADDRESS,
    name: "Figment",
    isOpen: true,
    isUnbonding: false,
    commissionPercent: 10,
    stakeMicrocredits: 1_000_000_000,
    nonEarningReason: null,
    estimatedYearlyRewardsRate: 0.05,
  },
];

const SECOND_VALIDATOR = {
  address: "aleo1l7avejc23yv6e8nx4udjwz89dw6mg95dzsp936hf77yuhnjywv9syl0ywc",
  name: "Kiln",
  isOpen: true,
  isUnbonding: false,
  commissionPercent: 3,
  stakeMicrocredits: 500_000_000,
  estimatedYearlyRewardsRate: 0.07,
};

const Stack = createNativeStackNavigator();

function BondFlowHarness() {
  return (
    <NotificationsPromptProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name={NavigatorName.AleoBondPublicFlow} component={BondPublicFlowNavigator} />
      </Stack.Navigator>
    </NotificationsPromptProvider>
  );
}

const FUNDED_ACCOUNT = makeAleoAccount({
  transparentBalance: new BigNumber(50_000 * CREDIT),
  bondedBalance: new BigNumber(0),
  bondedValidator: null,
});

function renderFlowAt(name: ScreenName, params: object, account: AleoAccount) {
  return render(<BondFlowHarness />, {
    navigationInitialState: {
      index: 0,
      routes: [
        {
          name: NavigatorName.AleoBondPublicFlow,
          state: { index: 0, routes: [{ name, params }] },
        },
      ],
    },
    overrideInitialState: state => ({
      ...state,
      accounts: { ...state.accounts, active: [account] },
    }),
  });
}

const renderSelectValidatorStep = (account: AleoAccount = FUNDED_ACCOUNT) =>
  renderFlowAt(ScreenName.AleoBondPublicSelectValidator, { accountId: account.id }, account);

const renderAmountStep = (account: AleoAccount = FUNDED_ACCOUNT) =>
  renderFlowAt(
    ScreenName.AleoBondPublicAmount,
    { accountId: account.id, validatorAddress: VALIDATOR_ADDRESS },
    account,
  );

describe("Aleo bond flow (integration)", () => {
  beforeEach(() => {
    mockRefetch.mockClear();
    resetAleoBridgeMock({
      transaction: BOND_TRANSACTION,
      operationType: "STAKE",
    });
    mockTransactionStatus({ amount: BOND_AMOUNT });
    mockUseAleoValidators.mockReturnValue({
      validators: MOCK_VALIDATORS,
      loading: false,
      error: null,
      refetch: mockRefetch,
    });
  });

  it("walks Validator → Amount → device → success without a Summary step", async () => {
    const { user } = renderSelectValidatorStep();

    await waitFor(() => expect(screen.getByText("Figment")).toBeVisible());
    await user.press(screen.getByText("Figment"));
    await user.press(screen.getByTestId("aleo-bond-select-validator-continue"));

    const amountContinue = await screen.findByTestId("aleo-bond-amount-continue");
    // Native stack duplicates the header label while the outgoing screen is still mounted.
    expect(screen.getAllByText("2 of 2")[0]).toBeVisible();
    await waitFor(() => expect(amountContinue).toBeEnabled());
    await user.press(amountContinue);

    await user.press(await screen.findByTestId("device-item-mock"));

    expect(await screen.findByTestId("device-action-loading")).toBeVisible();
    await waitFor(() => expect(screen.getByTestId("validate-success-screen")).toBeVisible(), {
      timeout: 5_000,
    });
  });

  it("Amount Continue navigates to SelectDevice with the bridge transaction", async () => {
    const { user } = renderAmountStep();

    const continueButton = await screen.findByTestId("aleo-bond-amount-continue");
    await waitFor(() => expect(continueButton).toBeEnabled());
    await user.press(continueButton);

    expect(await screen.findByTestId("device-item-mock")).toBeVisible();
  });

  describe("SelectValidator", () => {
    it("shows a spinner and no validator while the list is loading", async () => {
      mockUseAleoValidators.mockReturnValue({
        validators: [],
        loading: true,
        error: null,
        refetch: mockRefetch,
      });

      renderSelectValidatorStep();

      await waitFor(() => expect(screen.queryByText("Figment")).toBeNull());
      expect(screen.UNSAFE_queryAllByType(TextInput)).toHaveLength(0);
    });

    it("renders the validator name, its shortened address and the commission line", async () => {
      renderSelectValidatorStep();

      await waitFor(() => expect(screen.getByText("Figment")).toBeVisible());
      expect(screen.getByText(shortAddressPreview(VALIDATOR_ADDRESS))).toBeVisible();
      expect(screen.getByText("5.0% est. · 10% commission")).toBeVisible();
    });

    it("uses the shortened address as the title when the validator has no name", async () => {
      mockUseAleoValidators.mockReturnValue({
        validators: [{ ...MOCK_VALIDATORS[0], name: undefined }],
        loading: false,
        error: null,
        refetch: mockRefetch,
      });

      renderSelectValidatorStep();

      const short = shortAddressPreview(VALIDATOR_ADDRESS);
      await waitFor(() => expect(screen.getAllByText(short)).toHaveLength(1));
    });

    it("pre-selects the configured default validator so Continue is immediately enabled", async () => {
      renderSelectValidatorStep();

      await waitFor(() => expect(screen.getByText("Figment")).toBeVisible());
      expect(screen.getByTestId("aleo-bond-select-validator-continue")).toBeEnabled();
    });

    it("moves the pre-selection to the first bondable validator when the default is closed", async () => {
      mockUseAleoValidators.mockReturnValue({
        validators: [{ ...MOCK_VALIDATORS[0], isOpen: false }, SECOND_VALIDATOR],
        loading: false,
        error: null,
        refetch: mockRefetch,
      });

      const { user } = renderSelectValidatorStep();

      await waitFor(() => expect(screen.getByText("Kiln")).toBeVisible());
      await user.press(screen.getByTestId("aleo-bond-select-validator-continue"));

      await waitFor(() =>
        expect(aleoAccountBridge.updateTransaction).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({ recipient: SECOND_VALIDATOR.address }),
        ),
      );
    });

    it("locks the list to the bonded validator and hides the search box", async () => {
      mockUseAleoValidators.mockReturnValue({
        validators: [MOCK_VALIDATORS[0], SECOND_VALIDATOR],
        loading: false,
        error: null,
        refetch: mockRefetch,
      });
      const bonded = makeAleoAccount({
        transparentBalance: new BigNumber(50_000 * CREDIT),
        bondedBalance: new BigNumber(6_000 * CREDIT),
        bondedValidator: VALIDATOR_ADDRESS,
      });

      const { user } = renderSelectValidatorStep(bonded);

      await waitFor(() => expect(screen.getByText("Figment")).toBeVisible());
      expect(screen.queryByText("Kiln")).toBeNull();
      expect(
        screen.getByText(
          "Aleo allows one validator per account. You can add to your stake with this validator, or unstake first to choose a different one.",
        ),
      ).toBeVisible();

      await user.press(screen.getByText("Figment"));
      await user.press(screen.getByTestId("aleo-bond-select-validator-continue"));

      expect(await screen.findByTestId("aleo-bond-amount-continue")).toBeVisible();
    });

    it("keeps a bonded validator that left the committee topped up through its address", async () => {
      mockUseAleoValidators.mockReturnValue({
        validators: [SECOND_VALIDATOR],
        loading: false,
        error: null,
        refetch: mockRefetch,
      });
      const bonded = makeAleoAccount({
        transparentBalance: new BigNumber(50_000 * CREDIT),
        bondedBalance: new BigNumber(6_000 * CREDIT),
        bondedValidator: VALIDATOR_ADDRESS,
      });

      const { user } = renderSelectValidatorStep(bonded);

      await waitFor(() =>
        expect(screen.getByText(shortAddressPreview(VALIDATOR_ADDRESS))).toBeVisible(),
      );
      expect(screen.queryByText("Kiln")).toBeNull();

      await user.press(screen.getByTestId("aleo-bond-select-validator-continue"));

      expect(await screen.findByTestId("aleo-bond-amount-continue")).toBeVisible();
    });

    it("keeps the bonded validator usable when the committee fetch fails", async () => {
      mockUseAleoValidators.mockReturnValue({
        validators: [],
        loading: false,
        error: new Error("boom"),
        refetch: mockRefetch,
      });
      const bonded = makeAleoAccount({
        transparentBalance: new BigNumber(50_000 * CREDIT),
        bondedBalance: new BigNumber(6_000 * CREDIT),
        bondedValidator: VALIDATOR_ADDRESS,
      });

      const { user } = renderSelectValidatorStep(bonded);

      await waitFor(() =>
        expect(screen.getByText(shortAddressPreview(VALIDATOR_ADDRESS))).toBeVisible(),
      );
      expect(screen.queryByText("Failed to load validators. Please try again.")).toBeNull();

      await user.press(screen.getByTestId("aleo-bond-select-validator-continue"));

      expect(await screen.findByTestId("aleo-bond-amount-continue")).toBeVisible();
    });

    it("warns that the bonded validator details are missing when the committee fetch fails", async () => {
      mockUseAleoValidators.mockReturnValue({
        validators: [],
        loading: false,
        error: new Error("boom"),
        refetch: mockRefetch,
      });
      const bonded = makeAleoAccount({
        transparentBalance: new BigNumber(50_000 * CREDIT),
        bondedBalance: new BigNumber(6_000 * CREDIT),
        bondedValidator: VALIDATOR_ADDRESS,
      });

      renderSelectValidatorStep(bonded);

      expect(
        await screen.findByText(
          "We couldn't load validators metadata. You can still add to your stake.",
        ),
      ).toBeVisible();
    });

    it("hides the missing details warning once the committee fetch succeeds", async () => {
      mockUseAleoValidators.mockReturnValue({
        validators: [MOCK_VALIDATORS[0]],
        loading: false,
        error: new Error("boom"),
        refetch: mockRefetch,
      });
      const bonded = makeAleoAccount({
        transparentBalance: new BigNumber(50_000 * CREDIT),
        bondedBalance: new BigNumber(6_000 * CREDIT),
        bondedValidator: VALIDATOR_ADDRESS,
      });

      renderSelectValidatorStep(bonded);

      await waitFor(() => expect(screen.getByText("Figment")).toBeVisible());
      expect(screen.queryByTestId("aleo-bond-validator-metadata-error")).toBeNull();
    });

    it("waits on the first load instead of flashing the bare bonded address", async () => {
      mockUseAleoValidators.mockReturnValue({
        validators: [],
        loading: true,
        error: null,
        refetch: mockRefetch,
      });
      const bonded = makeAleoAccount({
        transparentBalance: new BigNumber(50_000 * CREDIT),
        bondedBalance: new BigNumber(6_000 * CREDIT),
        bondedValidator: VALIDATOR_ADDRESS,
      });

      renderSelectValidatorStep(bonded);

      expect(await screen.findByTestId("aleo-bond-validator-list-loading")).toBeVisible();
      expect(screen.queryByText(shortAddressPreview(VALIDATOR_ADDRESS))).toBeNull();
    });

    it("keeps showing the cached list when a refresh fails", async () => {
      mockUseAleoValidators.mockReturnValue({
        validators: MOCK_VALIDATORS,
        loading: false,
        error: new Error("boom"),
        refetch: mockRefetch,
      });

      const { user } = renderSelectValidatorStep();

      await waitFor(() => expect(screen.getByText("Figment")).toBeVisible());
      expect(screen.queryByText("Failed to load validators. Please try again.")).toBeNull();

      await user.press(screen.getByTestId("aleo-bond-select-validator-continue"));

      expect(await screen.findByTestId("aleo-bond-amount-continue")).toBeVisible();
    });

    it("marks a non-bondable validator row as disabled", async () => {
      mockUseAleoValidators.mockReturnValue({
        validators: [{ ...MOCK_VALIDATORS[0], isOpen: false }, SECOND_VALIDATOR],
        loading: false,
        error: null,
        refetch: mockRefetch,
      });

      renderSelectValidatorStep();

      await waitFor(() => expect(screen.getByText("Kiln")).toBeVisible());
      const [closedRow, openRow] = screen.getAllByTestId("AleoBondSelectValidator");
      expect(closedRow).toBeDisabled();
      expect(openRow).toBeEnabled();
    });

    it("shows the fetch error with a retry and no free-text address field", async () => {
      mockUseAleoValidators.mockReturnValue({
        validators: [],
        loading: false,
        error: new Error("boom"),
        refetch: mockRefetch,
      });

      const { user } = renderSelectValidatorStep();

      await waitFor(() =>
        expect(screen.getByText("Failed to load validators. Please try again.")).toBeVisible(),
      );
      expect(screen.UNSAFE_queryAllByType(TextInput)).toHaveLength(0);

      await user.press(screen.getByText(/retry/i));

      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });

    it("filters the list by name, by address fragment, and shows nothing on a miss", async () => {
      mockUseAleoValidators.mockReturnValue({
        validators: [MOCK_VALIDATORS[0], SECOND_VALIDATOR],
        loading: false,
        error: null,
        refetch: mockRefetch,
      });

      const { user } = renderSelectValidatorStep();

      await waitFor(() => expect(screen.getByText("Figment")).toBeVisible());
      const searchBox = screen.getByTestId("delegation-search-pool-input");

      await user.type(searchBox, "kil");
      await waitFor(() => expect(screen.queryByText("Figment")).toBeNull());
      expect(screen.getByText("Kiln")).toBeVisible();

      await user.clear(searchBox);
      await user.type(searchBox, "aleo1q3vx8pe");
      await waitFor(() => expect(screen.queryByText("Kiln")).toBeNull());
      expect(screen.getByText("Figment")).toBeVisible();

      await user.clear(searchBox);
      await user.type(searchBox, "zzzz");
      await waitFor(() => expect(screen.queryByText("Figment")).toBeNull());
      expect(screen.queryByText("Kiln")).toBeNull();
    });
  });

  describe("Amount", () => {
    it("disables Continue when the amount is zero", async () => {
      mockTransactionStatus({ amount: new BigNumber(0) });

      renderAmountStep();

      await waitFor(() => expect(screen.getByText(/available/i)).toBeVisible());
      expect(screen.getByTestId("aleo-bond-amount-continue")).toBeDisabled();
    });

    it("shows the estimated fees from the transaction status", async () => {
      mockTransactionStatus({ estimatedFees: new BigNumber(25_000) });

      renderAmountStep();

      await waitFor(() => expect(screen.getByText(/0\.025 ALEO/)).toBeVisible());
    });

    it("toggles useAllAmount through the switch and locks the input", async () => {
      renderAmountStep();

      const toggle = await screen.findByTestId("aleo-bond-use-all-amount");
      expect(screen.getByTestId("aleo-bond-amount-input")).toBeEnabled();

      fireEvent(toggle, "valueChange", true);

      await waitFor(() =>
        expect(aleoAccountBridge.updateTransaction).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({ useAllAmount: true }),
        ),
      );
      await waitFor(() => expect(screen.getByTestId("aleo-bond-amount-input")).toBeDisabled());

      fireEvent(toggle, "valueChange", false);

      await waitFor(() =>
        expect(aleoAccountBridge.updateTransaction).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({ useAllAmount: false }),
        ),
      );
    });

    it("shows the plain minimum for an account with nothing bonded", async () => {
      renderAmountStep();

      await waitFor(() => expect(screen.getByText("Minimum bond amount")).toBeVisible());

      expect(screen.getByTestId("aleo-bond-minimum-value")).toHaveTextContent("10,000 ALEO");
      expect(screen.queryByText(/Add at least/)).toBeNull();
    });

    it("shows the top-up minimum for an account with an existing bond", async () => {
      const toppingUp = makeAleoAccount({
        transparentBalance: new BigNumber(50_000 * CREDIT),
        bondedBalance: new BigNumber(6_000 * CREDIT),
        bondedValidator: VALIDATOR_ADDRESS,
      });

      renderAmountStep(toppingUp);

      await waitFor(() => expect(screen.getByText(/Add at least/)).toBeVisible());
      expect(screen.getByText(/4,000 ALEO/)).toBeVisible();
      expect(screen.getByText(/to reach the 10,000 ALEO total stake/)).toBeVisible();
    });

    it("shows the plain minimum, not the top-up copy, once the bonded balance already clears the delegator minimum", async () => {
      const wellBonded = makeAleoAccount({
        transparentBalance: new BigNumber(50_000 * CREDIT),
        bondedBalance: new BigNumber(25_000 * CREDIT),
        bondedValidator: VALIDATOR_ADDRESS,
      });

      renderAmountStep(wellBonded);

      await waitFor(() => expect(screen.getByText("Minimum bond amount")).toBeVisible());
      expect(screen.queryByText(/Add at least/)).toBeNull();
    });

    it("treats a missing aleoResources as no public balance rather than trusting the spendable balance", async () => {
      const { aleoResources: _dropped, ...withoutResources } = FUNDED_ACCOUNT;
      // spendableBalance also counts private ALEO, which bond_public cannot spend.
      const account = {
        ...withoutResources,
        spendableBalance: new BigNumber(50_000 * CREDIT),
      } as AleoAccount;

      renderAmountStep(account);

      await waitFor(() => expect(screen.getByText(/short of the/)).toBeVisible());
    });

    it("warns but keeps the max switch usable when the public balance is below the minimum", async () => {
      const short = makeAleoAccount({
        transparentBalance: new BigNumber(3_016 * CREDIT),
        bondedBalance: new BigNumber(0),
        bondedValidator: null,
      });

      renderAmountStep(short);

      await waitFor(() => expect(screen.getByText(/short of the/)).toBeVisible());
      expect(screen.getByText(/6,984 ALEO/)).toBeVisible();
      expect(screen.getByTestId("aleo-bond-use-all-amount")).toBeEnabled();
    });
  });

  describe("Amount errors", () => {
    it("renders AleoBondAmountTooLow and disables Continue", async () => {
      mockTransactionStatus({
        amount: new BigNumber(500_000),
        errors: {
          amount: new AleoBondAmountTooLow(undefined, { minAmount: "1 ALEO" }),
        },
      });

      renderAmountStep();

      await waitFor(() =>
        expect(screen.getByText("You must stake at least 1 ALEO at a time.")).toBeVisible(),
      );
      expect(screen.getByTestId("aleo-bond-amount-continue")).toBeDisabled();
      expect(screen.queryByTestId("aleo-bond-change-validator")).toBeNull();
    });

    it("renders AleoStakeAmountTooLow and disables Continue", async () => {
      mockTransactionStatus({
        amount: new BigNumber(2_000 * CREDIT),
        errors: {
          amount: new AleoStakeAmountTooLow(undefined, {
            minAmount: "10,000 ALEO",
          }),
        },
      });

      renderAmountStep();

      await waitFor(() =>
        expect(screen.getByText("Staking requires a total of at least 10,000 ALEO.")).toBeVisible(),
      );
      expect(screen.getByTestId("aleo-bond-amount-continue")).toBeDisabled();
    });

    it("renders NotEnoughBalance from the fees key and disables Continue", async () => {
      mockTransactionStatus({
        amount: new BigNumber(50_000 * CREDIT),
        errors: { fees: new NotEnoughBalance() },
      });

      renderAmountStep();

      await waitFor(() => expect(screen.getByText("Sorry, insufficient funds")).toBeVisible());
      expect(screen.getByTestId("aleo-bond-amount-continue")).toBeDisabled();
    });

    it("renders AleoAlreadyBondedElsewhere and offers a way back to the picker", async () => {
      mockTransactionStatus({
        amount: new BigNumber(20_000 * CREDIT),
        errors: {
          recipient: new AleoAlreadyBondedElsewhere(undefined, {
            bondedValidator: "aleo1other",
          }),
        },
      });

      renderAmountStep();

      await waitFor(() =>
        expect(
          screen.getByText("Already staking with aleo1other. Unstake before changing validator."),
        ).toBeVisible(),
      );
      expect(screen.getByTestId("aleo-bond-amount-continue")).toBeDisabled();
      expect(screen.getByTestId("aleo-bond-change-validator")).toBeVisible();
    });

    it("renders AleoClosedValidator and offers a way back to the picker", async () => {
      mockTransactionStatus({
        amount: new BigNumber(20_000 * CREDIT),
        errors: { recipient: new AleoClosedValidator() },
      });

      renderAmountStep();

      await waitFor(() =>
        expect(screen.getByText("This validator is not accepting new delegators.")).toBeVisible(),
      );
      expect(screen.getByTestId("aleo-bond-change-validator")).toBeVisible();
    });

    it("renders AleoUnbondingValidator and offers a way back to the picker", async () => {
      mockTransactionStatus({
        amount: new BigNumber(20_000 * CREDIT),
        errors: { recipient: new AleoUnbondingValidator() },
      });

      renderAmountStep();

      await waitFor(() => expect(screen.getByText("This validator is unbonding.")).toBeVisible());
      expect(screen.getByTestId("aleo-bond-change-validator")).toBeVisible();
    });

    it("prioritizes the recipient error over a simultaneous amount error", async () => {
      mockTransactionStatus({
        amount: new BigNumber(20_000 * CREDIT),
        errors: {
          recipient: new AleoClosedValidator(),
          amount: new AleoBondAmountTooLow(undefined, { minAmount: "1 ALEO" }),
        },
      });

      renderAmountStep();

      await waitFor(() =>
        expect(screen.getByText("This validator is not accepting new delegators.")).toBeVisible(),
      );
      expect(screen.getByTestId("aleo-bond-change-validator")).toBeVisible();
      expect(screen.queryByText("You must stake at least 1 ALEO at a time.")).toBeNull();
    });

    it("shows no error text for AmountRequired on an untouched screen but keeps Continue disabled", async () => {
      mockTransactionStatus({
        amount: new BigNumber(0),
        errors: { amount: new AmountRequired() },
      });

      renderAmountStep();

      await waitFor(() => expect(screen.getByTestId("aleo-bond-amount-continue")).toBeDisabled());
      expect(screen.queryByText("Enter an amount to continue.")).toBeNull();
      expect(screen.queryByTestId("aleo-bond-change-validator")).toBeNull();
    });

    it("renders AmountRequired once the max switch owns the amount", async () => {
      mockTransactionStatus({
        amount: new BigNumber(0),
        errors: { amount: new AmountRequired() },
      });

      renderAmountStep();

      fireEvent(await screen.findByTestId("aleo-bond-use-all-amount"), "valueChange", true);

      await waitFor(() => expect(screen.getByText("Enter an amount to continue.")).toBeVisible());
      expect(screen.getByTestId("aleo-bond-amount-continue")).toBeDisabled();
    });

    it("the change-validator button returns to SelectValidator", async () => {
      mockTransactionStatus({
        amount: new BigNumber(20_000 * CREDIT),
        errors: { recipient: new AleoClosedValidator() },
      });

      const { user } = renderAmountStep();

      await user.press(await screen.findByTestId("aleo-bond-change-validator"));

      await waitFor(() => expect(screen.getByText("Figment")).toBeVisible());
    });
  });
});
