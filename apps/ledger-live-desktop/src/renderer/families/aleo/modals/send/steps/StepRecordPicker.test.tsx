import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "tests/testSetup";
import * as currencies from "@ledgerhq/live-common/currencies/index";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import type {
  AleoAccount,
  AleoUnspentRecord,
  AleoDecryptedRecordResponse,
  TransactionPrivate,
  TransactionStatus,
} from "@ledgerhq/live-common/families/aleo/types";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { useDateFormatter } from "~/renderer/hooks/useDateFormatter";
import i18n from "~/renderer/i18n/init";
import type { StepProps } from "~/renderer/modals/Send/types";
import StepRecordPicker from "./StepRecordPicker";
import { ALEO_ACCOUNT_1 } from "../../../__mocks__/account.mock";

jest.mock("~/renderer/hooks/useAccountUnit");
jest.mock("~/renderer/hooks/useDateFormatter");
jest.mock("@ledgerhq/live-common/currencies/index");

const mockUseDateFormatter = jest.mocked(useDateFormatter);

const mockUseAccountUnit = jest.mocked(useAccountUnit);

const mockDecryptedData1: AleoDecryptedRecordResponse = {
  owner: "aleo1abc123",
  data: { microcredits: "1000000u64.private" },
  nonce: "0group",
  version: 1,
};

const mockDecryptedData2: AleoDecryptedRecordResponse = {
  owner: "aleo1def456",
  data: { microcredits: "2000000u64.private" },
  nonce: "1group",
  version: 1,
};

const makeUnspentRecord = (
  commitment: string,
  microcredits: string,
  decryptedData: AleoDecryptedRecordResponse,
): AleoUnspentRecord => ({
  block_height: 100,
  block_timestamp: 1000000,
  commitment,
  function_name: "transfer_private",
  output_index: 0,
  owner: decryptedData.owner,
  program_name: "credits.aleo",
  record_ciphertext: `cipher_${commitment}`,
  record_name: "credits",
  sender: "aleo1sender",
  spent: false,
  tag: `tag_${commitment}`,
  transaction_id: `tx_${commitment}`,
  transition_id: `ts_${commitment}`,
  transaction_index: 0,
  transition_index: 0,
  microcredits,
  decryptedData,
});

describe("StepRecordPicker", () => {
  const record1 = makeUnspentRecord("commitment1", "1000000", mockDecryptedData1);
  const record2 = makeUnspentRecord("commitment2", "2000000", mockDecryptedData2);

  const mockAleoAccount: AleoAccount = {
    ...ALEO_ACCOUNT_1,
    aleoResources: {
      transparentBalance: new BigNumber(0),
      privateBalance: new BigNumber(3000000),
      unspentPrivateRecords: [record1, record2],
      provableApi: null,
      lastPrivateSyncDate: null,
    },
  };

  const privateTransaction: TransactionPrivate = {
    family: "aleo",
    mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
    recipient: "",
    amount: new BigNumber(0),
    fees: new BigNumber(0),
    useAllAmount: false,
    properties: {
      feeRecordCommitment: null,
      amountRecordCommitment: null,
    },
  };

  const mockStatus: TransactionStatus = {
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber(0),
    amount: new BigNumber(0),
    totalSpent: new BigNumber(0),
  };

  const defaultProps: Omit<StepProps, "account" | "transaction"> = {
    t: i18n.t.bind(i18n),
    parentAccount: null,
    openedFromAccount: false,
    onChangeAccount: jest.fn(),
    error: null,
    status: mockStatus,
    currencyName: "Aleo",
    transitionTo: jest.fn(),
    device: null,
    bridgePending: false,
    optimisticOperation: null,
    closeModal: jest.fn(),
    openModal: jest.fn(),
    onChangeTransaction: jest.fn(),
    onTransactionError: jest.fn(),
    onOperationBroadcasted: jest.fn(),
    onRetry: jest.fn(),
    setSigned: jest.fn(),
    signed: false,
    onResetMaybeRecipient: jest.fn(),
    onResetMaybeAmount: jest.fn(),
    updateTransaction: jest.fn(),
    onConfirmationHandler: jest.fn(),
    onFailHandler: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAccountUnit.mockReturnValue({
      code: "ALEO",
      name: "Aleo",
      magnitude: 6,
    });
    mockUseDateFormatter.mockReturnValue(() => "Jan 1, 2000");
    jest
      .spyOn(currencies, "formatCurrencyUnit")
      .mockImplementation((_unit, value) => `${value.toString()} ALEO`);
  });

  it("should render the record picker label with the record count", () => {
    render(
      <StepRecordPicker
        {...defaultProps}
        account={mockAleoAccount}
        transaction={privateTransaction}
      />,
    );

    expect(screen.getByText(/Available records:.*2/)).toBeInTheDocument();
  });

  it("should render a button for each unspent record", () => {
    render(
      <StepRecordPicker
        {...defaultProps}
        account={mockAleoAccount}
        transaction={privateTransaction}
      />,
    );

    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  it("should render the formatted amount for each record", () => {
    render(
      <StepRecordPicker
        {...defaultProps}
        account={mockAleoAccount}
        transaction={privateTransaction}
      />,
    );

    expect(screen.getByText("1000000 ALEO")).toBeInTheDocument();
    expect(screen.getByText("2000000 ALEO")).toBeInTheDocument();
  });

  it("should render no buttons when account has no unspent records", () => {
    const emptyAccount: AleoAccount = {
      ...mockAleoAccount,
      aleoResources: {
        ...mockAleoAccount.aleoResources!,
        unspentPrivateRecords: [],
      },
    };

    render(
      <StepRecordPicker
        {...defaultProps}
        account={emptyAccount}
        transaction={privateTransaction}
      />,
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("should show a warning alert when there are no unspent records", () => {
    const emptyAccount: AleoAccount = {
      ...mockAleoAccount,
      aleoResources: {
        ...mockAleoAccount.aleoResources!,
        unspentPrivateRecords: [],
      },
    };

    render(
      <StepRecordPicker
        {...defaultProps}
        account={emptyAccount}
        transaction={privateTransaction}
      />,
    );

    expect(
      screen.getByText(
        "You don't have any records available. Perform self transfer or receive private funds to get started.",
      ),
    ).toBeInTheDocument();
  });

  it("should show 'No records available' message when there are no unspent records", () => {
    const emptyAccount: AleoAccount = {
      ...mockAleoAccount,
      aleoResources: {
        ...mockAleoAccount.aleoResources!,
        unspentPrivateRecords: [],
      },
    };

    render(
      <StepRecordPicker
        {...defaultProps}
        account={emptyAccount}
        transaction={privateTransaction}
      />,
    );

    expect(screen.getByText("No records available")).toBeInTheDocument();
  });

  it("should show the label without a count when there are no unspent records", () => {
    const emptyAccount: AleoAccount = {
      ...mockAleoAccount,
      aleoResources: {
        ...mockAleoAccount.aleoResources!,
        unspentPrivateRecords: [],
      },
    };

    render(
      <StepRecordPicker
        {...defaultProps}
        account={emptyAccount}
        transaction={privateTransaction}
      />,
    );

    expect(screen.getByText("Available records")).toBeInTheDocument();
    expect(screen.queryByText(/Available records:.*\d/)).not.toBeInTheDocument();
  });

  it("should call updateTransaction with the highest-value record when the first button is clicked", async () => {
    const updateTransaction = jest.fn();
    const { user } = render(
      <StepRecordPicker
        {...defaultProps}
        account={mockAleoAccount}
        transaction={privateTransaction}
        updateTransaction={updateTransaction}
      />,
    );

    // records are sorted DESC by microcredits: record2 (2000000) first, record1 (1000000) second
    const buttons = screen.getAllByRole("button");
    await user.click(buttons[0]);

    expect(updateTransaction).toHaveBeenCalledTimes(1);
    const updaterFn = updateTransaction.mock.calls[0][0];
    const result = updaterFn(privateTransaction);
    expect(result.properties?.amountRecordCommitment).toBe(record2.commitment);
  });

  it("should call updateTransaction with the lower-value record when the second button is clicked", async () => {
    const updateTransaction = jest.fn();
    const { user } = render(
      <StepRecordPicker
        {...defaultProps}
        account={mockAleoAccount}
        transaction={privateTransaction}
        updateTransaction={updateTransaction}
      />,
    );

    // records are sorted DESC by microcredits: record2 (2000000) first, record1 (1000000) second
    const buttons = screen.getAllByRole("button");
    await user.click(buttons[1]);

    expect(updateTransaction).toHaveBeenCalledTimes(1);
    const updaterFn = updateTransaction.mock.calls[0][0];
    const result = updaterFn(privateTransaction);
    expect(result.properties?.amountRecordCommitment).toBe(record1.commitment);
  });

  it("should render records sorted in descending order by value", () => {
    render(
      <StepRecordPicker
        {...defaultProps}
        account={mockAleoAccount}
        transaction={privateTransaction}
      />,
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toHaveTextContent("2000000 ALEO");
    expect(buttons[1]).toHaveTextContent("1000000 ALEO");
  });

  it("should show an info alert when records are available", () => {
    render(
      <StepRecordPicker
        {...defaultProps}
        account={mockAleoAccount}
        transaction={privateTransaction}
      />,
    );

    expect(screen.getByTestId("aleo-pick-records-alert")).toBeInTheDocument();
    expect(
      screen.getByText(
        "The maximum spendable amount depends on the maximum value of your selected record. Fees are sponsored by Provable for Ledger users.",
      ),
    ).toBeInTheDocument();
  });

  it("should render at most 10 records", () => {
    const manyRecords = Array.from({ length: 15 }, (_, i) =>
      makeUnspentRecord(`commitment${i}`, String((i + 1) * 100000), mockDecryptedData1),
    );
    const accountWithManyRecords: AleoAccount = {
      ...mockAleoAccount,
      aleoResources: {
        ...mockAleoAccount.aleoResources!,
        unspentPrivateRecords: manyRecords,
      },
    };

    render(
      <StepRecordPicker
        {...defaultProps}
        account={accountWithManyRecords}
        transaction={privateTransaction}
      />,
    );

    expect(screen.getAllByRole("button")).toHaveLength(10);
  });

  it("should show a records limit message when there are more than 10 records", () => {
    const manyRecords = Array.from({ length: 15 }, (_, i) =>
      makeUnspentRecord(`commitment${i}`, String((i + 1) * 100000), mockDecryptedData1),
    );
    const accountWithManyRecords: AleoAccount = {
      ...mockAleoAccount,
      aleoResources: {
        ...mockAleoAccount.aleoResources!,
        unspentPrivateRecords: manyRecords,
      },
    };

    render(
      <StepRecordPicker
        {...defaultProps}
        account={accountWithManyRecords}
        transaction={privateTransaction}
      />,
    );

    expect(screen.getByText("Maximum 10 records are shown")).toBeInTheDocument();
  });

  it("should not show a records limit message when there are 10 or fewer records", () => {
    render(
      <StepRecordPicker
        {...defaultProps}
        account={mockAleoAccount}
        transaction={privateTransaction}
      />,
    );

    expect(screen.queryByText(/Maximum.*records are shown/)).not.toBeInTheDocument();
  });

  it("should show the total records count in the label, not just the displayed ones", () => {
    const manyRecords = Array.from({ length: 15 }, (_, i) =>
      makeUnspentRecord(`commitment${i}`, String((i + 1) * 100000), mockDecryptedData1),
    );
    const accountWithManyRecords: AleoAccount = {
      ...mockAleoAccount,
      aleoResources: {
        ...mockAleoAccount.aleoResources!,
        unspentPrivateRecords: manyRecords,
      },
    };

    render(
      <StepRecordPicker
        {...defaultProps}
        account={accountWithManyRecords}
        transaction={privateTransaction}
      />,
    );

    expect(screen.getByText(/Available records:.*15/)).toBeInTheDocument();
  });
});
