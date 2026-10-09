import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "@tests/test-renderer";
import type { Transaction } from "@ledgerhq/live-common/families/aleo/types";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import { ALEO_ACCOUNT_1 } from "../__mocks__/account.mock";
import { useAleoPrivateSync } from "../hooks/useAleoPrivateSync";
import SendBalanceTypeSync from "../SendBalanceTypeSync";

jest.mock("../hooks/useAleoPrivateSync");

const mockedUseAleoPrivateSync = jest.mocked(useAleoPrivateSync);
const mockStart = jest.fn();
const mockOnComplete = jest.fn();

const publicTransaction = {
  family: "aleo",
  amount: new BigNumber(0),
  recipient: "",
  fees: new BigNumber(0),
  mode: TRANSACTION_TYPE.TRANSFER_PUBLIC,
} as Transaction;

const privateTransaction = {
  ...publicTransaction,
  mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
  properties: { amountRecordCommitments: [], feeRecordCommitment: null },
} as Transaction;

function mockSync(state: { progress?: number; isSyncing?: boolean; error?: Error | null }) {
  mockedUseAleoPrivateSync.mockReturnValue({
    progress: state.progress ?? 0,
    isSyncing: state.isSyncing ?? false,
    error: state.error ?? null,
    start: mockStart,
    stop: jest.fn(),
  });
}

function renderSync(transaction: Transaction) {
  return render(
    <SendBalanceTypeSync
      account={ALEO_ACCOUNT_1}
      transaction={transaction}
      onComplete={mockOnComplete}
    />,
  );
}

describe("SendBalanceTypeSync", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSync({ isSyncing: true, progress: 0 });
  });

  it("GIVEN the public balance WHEN rendered THEN it completes straight away without syncing", () => {
    renderSync(publicTransaction);

    expect(mockOnComplete).toHaveBeenCalledTimes(1);
    expect(mockedUseAleoPrivateSync).not.toHaveBeenCalled();
    expect(screen.queryByTestId("aleo-private-sync")).toBeNull();
  });

  it("GIVEN the private balance WHEN rendered THEN it starts a sync that survives the screen", () => {
    renderSync(privateTransaction);

    expect(mockedUseAleoPrivateSync).toHaveBeenCalledWith({
      account: ALEO_ACCOUNT_1,
      autoStart: true,
      keepAliveOnUnmount: true,
    });
  });

  it("GIVEN a running sync WHEN rendered THEN the progress is shown and the flow waits", () => {
    mockSync({ isSyncing: true, progress: 42.4 });

    renderSync(privateTransaction);

    expect(screen.getByText("Refreshing your private balance")).toBeOnTheScreen();
    expect(screen.getByText("42% synced")).toBeOnTheScreen();
    expect(mockOnComplete).not.toHaveBeenCalled();
  });

  it("GIVEN a finished sync WHEN rendered THEN the flow moves on", () => {
    mockSync({ isSyncing: false, progress: 100 });

    renderSync(privateTransaction);

    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });

  it("GIVEN a failed sync WHEN retry is pressed THEN the sync restarts and the flow waits", async () => {
    mockSync({ isSyncing: false, progress: 100, error: new Error("sync failed") });

    const { user } = renderSync(privateTransaction);

    expect(screen.getByText("Private sync failed")).toBeOnTheScreen();
    expect(mockOnComplete).not.toHaveBeenCalled();

    await user.press(screen.getByText("Retry"));

    expect(mockStart).toHaveBeenCalledTimes(1);
  });
});
