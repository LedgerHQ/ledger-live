import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "tests/testSetup";
import {
  getCryptoCurrencyById,
  setSupportedCurrencies,
} from "@ledgerhq/live-common/currencies/index";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type {
  TezosAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/tezos/types";
import { useTezosStakingInfo } from "@ledgerhq/live-common/families/tezos/react";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import StepAmount, { StepAmountFooter } from "../StepAmount";
import type { StepProps } from "../../types";

jest.mock("@ledgerhq/live-common/families/tezos/react", () => ({
  __esModule: true,
  useTezosStakingInfo: jest.fn(),
}));
jest.mock("~/renderer/hooks/useAccountUnit");
jest.mock("~/renderer/analytics/TrackPage", () => ({ __esModule: true, default: () => null }));
jest.mock("~/renderer/components/ErrorBanner", () => ({
  __esModule: true,
  default: ({ error }: { error: Error }) => <div data-testid="error-banner">{error?.message}</div>,
}));
jest.mock("~/renderer/components/CurrencyDownStatusAlert", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("~/renderer/components/FormattedVal", () => ({
  __esModule: true,
  default: ({ val }: { val: BigNumber }) => (
    <span data-testid="formatted-val">{val.toString()}</span>
  ),
}));
jest.mock("~/renderer/modals/Send/fields/AmountField", () => ({
  __esModule: true,
  default: ({
    transaction,
    status,
    withUseMaxLabel,
  }: {
    transaction: { useAllAmount?: boolean };
    status: TransactionStatus;
    withUseMaxLabel?: boolean;
  }) => (
    <div data-testid="amount-field">
      <span data-testid="amount-field-amount">{status?.amount?.toString()}</span>
      <span data-testid="amount-field-useallamount">{String(!!transaction.useAllAmount)}</span>
      <span data-testid="amount-field-usemaxlabel">{String(!!withUseMaxLabel)}</span>
    </div>
  ),
}));
jest.mock("~/renderer/modals/Send/AccountFooter", () => ({
  __esModule: true,
  default: () => <div data-testid="account-footer" />,
}));

const mockedUseTezosStakingInfo = jest.mocked(useTezosStakingInfo);
const mockedUseAccountUnit = jest.mocked(useAccountUnit);

setSupportedCurrencies(["tezos"]);
const currency = getCryptoCurrencyById("tezos");
const account = {
  ...genAccount("tezos-unstake-stepamount", { currency }),
} as unknown as TezosAccount;
const tezosUnit = currency.units[0];

type StakingInfo = ReturnType<typeof useTezosStakingInfo>;

const makeStakingInfo = (overrides: Partial<StakingInfo> = {}): StakingInfo => ({
  isDelegated: true,
  isStaked: true,
  hasUnstaking: false,
  delegation: null,
  stakedBalance: new BigNumber(500),
  unstakedBalance: new BigNumber(0),
  unstakedFinalizable: new BigNumber(0),
  availableBalance: new BigNumber(1000),
  delegateAddress: undefined,
  unstakingPositions: [],
  ...overrides,
});

const makeStatus = (overrides: Partial<TransactionStatus> = {}) =>
  ({
    amount: new BigNumber(0),
    errors: {},
    warnings: {},
    ...overrides,
  }) as unknown as TransactionStatus;

const makeProps = (overrides: Partial<StepProps> = {}): StepProps => ({
  t: ((k: string) => k) as unknown as StepProps["t"],
  transitionTo: jest.fn(),
  device: null,
  account,
  parentAccount: null,
  transaction: {
    family: "tezos",
    mode: "unstake",
    amount: new BigNumber(0),
    useAllAmount: false,
  } as unknown as Transaction,
  status: makeStatus(),
  bridgePending: false,
  signed: false,
  optimisticOperation: null,
  error: null,
  onClose: jest.fn(),
  onChangeTransaction: jest.fn(),
  onOperationBroadcasted: jest.fn(),
  onTransactionError: jest.fn(),
  onRetry: jest.fn(),
  setSigned: jest.fn(),
  ...overrides,
});

const setupHooks = (overrides: Partial<StakingInfo> = {}) => {
  mockedUseTezosStakingInfo.mockReturnValue(makeStakingInfo(overrides));
  mockedUseAccountUnit.mockReturnValue(tezosUnit);
};

beforeEach(() => jest.clearAllMocks());

describe("UnstakeFlowModal/StepAmount", () => {
  it("renders the unbonding notice and staked balance", () => {
    setupHooks({ stakedBalance: new BigNumber(500) });
    render(<StepAmount {...makeProps()} />);
    expect(screen.getByText(/Unstaking takes 4 days/i)).toBeInTheDocument();
    expect(screen.getByTestId("formatted-val")).toHaveTextContent("500");
  });

  it("delegates the amount input to the shared AmountField with withUseMaxLabel", () => {
    setupHooks({ stakedBalance: new BigNumber(500) });
    render(<StepAmount {...makeProps()} />);
    expect(screen.getByTestId("amount-field-usemaxlabel")).toHaveTextContent("true");
    expect(screen.getByTestId("amount-field-useallamount")).toHaveTextContent("false");
  });

  it("forwards useAllAmount=true through the transaction to AmountField", () => {
    setupHooks({ stakedBalance: new BigNumber(500) });
    render(
      <StepAmount
        {...makeProps({
          transaction: {
            family: "tezos",
            mode: "unstake",
            amount: new BigNumber(0),
            useAllAmount: true,
          } as unknown as Transaction,
          status: makeStatus({ amount: new BigNumber(500) }),
        })}
      />,
    );
    expect(screen.getByTestId("amount-field-useallamount")).toHaveTextContent("true");
    expect(screen.getByTestId("amount-field-amount")).toHaveTextContent("500");
  });

  it("renders ErrorBanner when the bridge surfaces an error", () => {
    setupHooks();
    render(<StepAmount {...makeProps({ error: new Error("network down") })} />);
    expect(screen.getByTestId("error-banner")).toHaveTextContent("network down");
  });
});

describe("UnstakeFlowModal/StepAmountFooter", () => {
  beforeEach(() => setupHooks());

  it("disables Continue while bridge is pending", () => {
    render(
      <StepAmountFooter
        {...makeProps({
          bridgePending: true,
          status: makeStatus({ amount: new BigNumber(100) }),
        })}
      />,
    );
    expect(screen.getByTestId("tezos-unstake-amount-continue-button")).toBeDisabled();
  });

  it("disables Continue when validation errors are present", () => {
    render(
      <StepAmountFooter
        {...makeProps({
          status: makeStatus({
            amount: new BigNumber(100),
            errors: { amount: new Error("NotEnoughBalance") },
          }),
        })}
      />,
    );
    expect(screen.getByTestId("tezos-unstake-amount-continue-button")).toBeDisabled();
  });

  it("Continue transitions to the device step when no errors and bridge is idle", async () => {
    const transitionTo = jest.fn();
    const { user } = render(
      <StepAmountFooter
        {...makeProps({
          transitionTo,
          status: makeStatus({ amount: new BigNumber(100) }),
        })}
      />,
    );
    const button = screen.getByTestId("tezos-unstake-amount-continue-button");
    expect(button).toBeEnabled();
    await user.click(button);
    expect(transitionTo).toHaveBeenCalledWith("device");
  });

  it("Cancel calls onClose", async () => {
    const onClose = jest.fn();
    const { user } = render(<StepAmountFooter {...makeProps({ onClose })} />);
    await user.click(screen.getByRole("button", { name: /Cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
