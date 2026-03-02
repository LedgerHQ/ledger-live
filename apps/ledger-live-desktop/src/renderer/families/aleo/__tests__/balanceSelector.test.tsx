import React from "react";
import { render, screen, userEvent } from "tests/testSetup";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/contants";
import BalanceSelector from "../shared/BalanceSelector";
import { ALEO_ACCOUNT_1 } from "../__mocks__/account.mock";
import type {
  Transaction,
  AleoAccount,
  TransactionType,
} from "@ledgerhq/live-common/families/aleo/types";
import { BigNumber } from "bignumber.js";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";

const mockUpdateTransaction = jest.fn();

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  __esModule: true,
  ...jest.requireActual("@ledgerhq/live-common/bridge/index"),
  getAccountBridge: jest.fn(),
}));

jest.mock("~/renderer/icons/Transfer", () => ({
  __esModule: true,
  default: () => <div>Transfer Icon</div>,
}));

jest.mock("~/renderer/icons/ArrowDown", () => ({
  __esModule: true,
  default: () => <div>Arrow Down Icon</div>,
}));

jest.mock("~/renderer/components/StepRecipientSeparator", () => ({
  __esModule: true,
  default: ({ icon }: { icon: React.ReactNode }) => <div data-testid="separator">{icon}</div>,
}));

jest.mock("../shared/TransferBtn", () => ({
  TransferBtn: jest.fn(({ onClick, balanceType, disabled }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid={`transfer-btn-${balanceType.toLowerCase()}`}
    >
      {balanceType}
    </button>
  )),
}));

jest.mock("../shared/helpers", () => ({
  formatSyncInfo: jest.fn((date: Date | null | undefined) => ({
    time: date ? "12:00 PM" : null,
    date: date ? "01/15/24" : null,
  })),
}));

const createMockTransaction = (type: TransactionType): Transaction => {
  const baseTransaction = {
    amount: new BigNumber(0),
    recipient: "",
    family: "aleo" as const,
    fees: new BigNumber(0),
    useAllAmount: false,
  };

  if (
    type === TRANSACTION_TYPE.TRANSFER_PRIVATE ||
    type === TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC
  ) {
    return {
      ...baseTransaction,
      type,
    };
  }

  return {
    ...baseTransaction,
    type,
  };
};

const createMockAccount = (
  transparentBalance: BigNumber,
  privateBalance: BigNumber | null,
  lastPrivateSyncDate: Date | null = null,
): AleoAccount => ({
  ...ALEO_ACCOUNT_1,
  aleoResources: {
    transparentBalance,
    provableApi: null,
    privateBalance,
    unspentPrivateRecords: null,
    lastPrivateSyncDate,
  },
  lastSyncDate: new Date("2024-01-20"),
});

describe("BalanceSelector", () => {
  let mockAccount: AleoAccount;
  let mockTransaction: Transaction;

  beforeEach(() => {
    mockAccount = createMockAccount(
      new BigNumber(1000000),
      new BigNumber(500000),
      new Date("2024-01-15"),
    );
    mockTransaction = createMockTransaction(TRANSACTION_TYPE.TRANSFER_PUBLIC);

    (getAccountBridge as jest.Mock).mockReturnValue({
      updateTransaction: mockUpdateTransaction,
    });
    mockUpdateTransaction.mockImplementation((tx, updates) => ({ ...tx, ...updates }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render public and private balance options", () => {
    render(
      <BalanceSelector
        mainAccount={mockAccount}
        transaction={mockTransaction}
        onChangeTransaction={jest.fn()}
      />,
    );

    expect(screen.getByTestId("transfer-btn-public")).toBeInTheDocument();
    expect(screen.getByTestId("transfer-btn-private")).toBeInTheDocument();
  });

  it("should show separator for regular transfer", () => {
    const { container } = render(
      <BalanceSelector
        mainAccount={mockAccount}
        transaction={createMockTransaction(TRANSACTION_TYPE.TRANSFER_PUBLIC)}
        onChangeTransaction={jest.fn()}
      />,
    );

    const separator = container.querySelector('[data-testid="separator"]');
    expect(separator).toBeInTheDocument();
  });

  it("should switch to private transfer when private balance is clicked", async () => {
    const onChangeTransaction = jest.fn();
    render(
      <BalanceSelector
        mainAccount={mockAccount}
        transaction={createMockTransaction(TRANSACTION_TYPE.TRANSFER_PUBLIC)}
        onChangeTransaction={onChangeTransaction}
      />,
    );

    const privateButton = screen.getByTestId("transfer-btn-private");
    await userEvent.click(privateButton);

    expect(mockUpdateTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ type: TRANSACTION_TYPE.TRANSFER_PUBLIC }),
      { type: TRANSACTION_TYPE.TRANSFER_PRIVATE },
    );
    expect(onChangeTransaction).toHaveBeenCalled();
  });

  it("should switch to public transfer when public balance is clicked", async () => {
    const onChangeTransaction = jest.fn();
    render(
      <BalanceSelector
        mainAccount={mockAccount}
        transaction={createMockTransaction(TRANSACTION_TYPE.TRANSFER_PRIVATE)}
        onChangeTransaction={onChangeTransaction}
      />,
    );

    const publicButton = screen.getByTestId("transfer-btn-public");
    await userEvent.click(publicButton);

    expect(mockUpdateTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ type: TRANSACTION_TYPE.TRANSFER_PRIVATE }),
      { type: TRANSACTION_TYPE.TRANSFER_PUBLIC },
    );
    expect(onChangeTransaction).toHaveBeenCalled();
  });

  it("should handle conversion from public to private", async () => {
    const onChangeTransaction = jest.fn();
    render(
      <BalanceSelector
        mainAccount={mockAccount}
        transaction={createMockTransaction(TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE)}
        onChangeTransaction={onChangeTransaction}
      />,
    );

    const privateButton = screen.getByTestId("transfer-btn-private");
    await userEvent.click(privateButton);

    expect(mockUpdateTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ type: TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE }),
      { type: TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC },
    );
  });

  it("should handle conversion from private to public", async () => {
    const onChangeTransaction = jest.fn();
    render(
      <BalanceSelector
        mainAccount={mockAccount}
        transaction={createMockTransaction(TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC)}
        onChangeTransaction={onChangeTransaction}
      />,
    );

    const publicButton = screen.getByTestId("transfer-btn-public");
    await userEvent.click(publicButton);

    expect(mockUpdateTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ type: TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC }),
      { type: TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE },
    );
  });

  it("should disable private balance when privateBalance is null", () => {
    const accountWithoutPrivate = createMockAccount(new BigNumber(1000000), null);

    render(
      <BalanceSelector
        mainAccount={accountWithoutPrivate}
        transaction={mockTransaction}
        onChangeTransaction={jest.fn()}
      />,
    );

    const privateButton = screen.getByTestId("transfer-btn-private");
    expect(privateButton).toBeDisabled();
  });

  it("should show transfer icon for self-transfer (conversion)", () => {
    render(
      <BalanceSelector
        mainAccount={mockAccount}
        transaction={createMockTransaction(TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE)}
        onChangeTransaction={jest.fn()}
      />,
    );

    expect(screen.getByText("Transfer Icon")).toBeInTheDocument();
  });

  it("should show arrow down icon for regular transfer", () => {
    render(
      <BalanceSelector
        mainAccount={mockAccount}
        transaction={createMockTransaction(TRANSACTION_TYPE.TRANSFER_PUBLIC)}
        onChangeTransaction={jest.fn()}
      />,
    );

    expect(screen.getByText("Arrow Down Icon")).toBeInTheDocument();
  });

  it("should not call onChangeTransaction when clicking already selected button", async () => {
    const onChangeTransaction = jest.fn();
    render(
      <BalanceSelector
        mainAccount={mockAccount}
        transaction={createMockTransaction(TRANSACTION_TYPE.TRANSFER_PUBLIC)}
        onChangeTransaction={onChangeTransaction}
      />,
    );

    const publicButton = screen.getByTestId("transfer-btn-public");
    await userEvent.click(publicButton);

    expect(onChangeTransaction).toHaveBeenCalled();
  });

  it("should handle account with zero transparent balance", () => {
    const accountWithZeroBalance = createMockAccount(
      new BigNumber(0),
      new BigNumber(500000),
      new Date("2024-01-15"),
    );

    render(
      <BalanceSelector
        mainAccount={accountWithZeroBalance}
        transaction={mockTransaction}
        onChangeTransaction={jest.fn()}
      />,
    );

    expect(screen.getByTestId("transfer-btn-public")).toBeInTheDocument();
    expect(screen.getByTestId("transfer-btn-public")).not.toBeDisabled();
  });
});
