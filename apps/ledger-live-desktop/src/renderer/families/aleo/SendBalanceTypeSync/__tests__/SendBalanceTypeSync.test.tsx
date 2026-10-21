import React from "react";
import { Dialog, DialogContent } from "@ledgerhq/lumen-ui-react";
import { act, render, screen } from "tests/testSetup";
import type { Account } from "@ledgerhq/types-live";
import type { AleoAccount, Transaction } from "@ledgerhq/live-common/families/aleo/types";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import { ALEO_MAIN_ACCOUNT, makeTokenAccount } from "../../__mocks__/account.mock";
import { makeRecord } from "../../__mocks__/record.mock";
import { makeAleoTransaction } from "../../__mocks__/transaction.mock";
import { useAleoPrivateSync } from "../../hooks/useAleoPrivateSync";
import SendBalanceTypeSync from "../SendBalanceTypeSync";

jest.mock("../../hooks/useAleoPrivateSync", () => ({
  useAleoPrivateSync: jest.fn(),
}));

const mockedUseAleoPrivateSync = jest.mocked(useAleoPrivateSync);
const mockStart = jest.fn();
const mockOnComplete = jest.fn();
const mockOnClose = jest.fn();

const ONE_ALEO = 1_000_000;

const publicTransaction = makeAleoTransaction({ mode: TRANSACTION_TYPE.TRANSFER_PUBLIC });
const privateTransaction = makeAleoTransaction({
  mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
  properties: { amountRecordCommitments: [], feeRecordCommitment: null },
});

function mockSync(state: { progress?: number; isSyncing?: boolean; error?: Error | null } = {}) {
  mockedUseAleoPrivateSync.mockReturnValue({
    progress: state.progress ?? 0,
    isSyncing: state.isSyncing ?? true,
    error: state.error ?? null,
    start: mockStart,
    stop: jest.fn(),
  });
}

function withRecords(microcredits: number[]): AleoAccount {
  return {
    ...ALEO_MAIN_ACCOUNT,
    aleoResources: {
      ...ALEO_MAIN_ACCOUNT.aleoResources!,
      unspentPrivateRecords: microcredits.map(makeRecord),
      provableApi: { scannerStatus: { synced: true, percentage: 100 } },
    },
  };
}

function completeSync(syncedAccount: Account) {
  const { onAccountUpdated } = mockedUseAleoPrivateSync.mock.calls.at(-1)![0];
  act(() => onAccountUpdated?.(syncedAccount));
}

function renderSync(transaction: Transaction, account: AleoAccount = ALEO_MAIN_ACCOUNT) {
  return render(
    <Dialog open>
      <DialogContent aria-describedby={undefined}>
        <SendBalanceTypeSync
          account={account}
          transaction={transaction}
          onComplete={mockOnComplete}
          onClose={mockOnClose}
        />
      </DialogContent>
    </Dialog>,
  );
}

describe("SendBalanceTypeSync", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSync();
  });

  it("moves on straight away when the public balance is picked", () => {
    renderSync(publicTransaction);

    expect(mockedUseAleoPrivateSync).not.toHaveBeenCalled();
    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });

  it("syncs the private records and shows the progress", () => {
    mockSync({ progress: 42.4 });

    renderSync(privateTransaction);

    expect(mockedUseAleoPrivateSync).toHaveBeenCalledWith(
      expect.objectContaining({
        account: ALEO_MAIN_ACCOUNT,
        autoStart: true,
        keepAliveOnUnmount: true,
      }),
    );
    expect(screen.getByText("Refreshing your private balance")).toBeVisible();
    expect(screen.getByText("42%")).toBeVisible();
    expect(screen.queryByRole("button")).toBeNull();
    expect(mockOnComplete).not.toHaveBeenCalled();
  });

  it("offers to try again or to close the flow when the sync fails", async () => {
    mockSync({ error: new Error("boom"), isSyncing: false });

    const { user } = renderSync(privateTransaction);

    expect(screen.getByText("Private sync failed")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(mockStart).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnComplete).not.toHaveBeenCalled();
  });

  it("does not move on when the sync finishes after the flow is closed", () => {
    const { unmount } = renderSync(privateTransaction);

    unmount();
    completeSync(withRecords([ONE_ALEO]));

    expect(mockOnComplete).not.toHaveBeenCalled();
  });

  it("moves on once synced when one transaction can use every record", () => {
    renderSync(privateTransaction);

    completeSync(withRecords(Array.from({ length: 14 }, () => ONE_ALEO)));

    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });

  it("does not count zero-value records against the limit", () => {
    renderSync(privateTransaction);

    completeSync(withRecords([...Array.from({ length: 14 }, () => ONE_ALEO), 0, 0]));

    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });

  it("waits for the sync error instead of moving on with the records a scanner reset keeps", () => {
    const syncedAccount = withRecords([ONE_ALEO]);
    const resetAccount: AleoAccount = {
      ...syncedAccount,
      aleoResources: { ...syncedAccount.aleoResources!, provableApi: null },
    };
    renderSync(privateTransaction);

    completeSync(resetAccount);

    expect(mockOnComplete).not.toHaveBeenCalled();
  });

  it("warns how much one transaction can send when the records exceed the limit", async () => {
    const { user } = renderSync(privateTransaction);

    completeSync(withRecords([...Array.from({ length: 14 }, () => ONE_ALEO), ONE_ALEO / 2]));

    expect(screen.getByText("You can send up to 14 ALEO")).toBeVisible();
    expect(screen.getByText(/one transaction can use a maximum of 14\./)).toBeVisible();
    expect(mockOnComplete).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });

  it("checks the token records of the synced account against the token limit", () => {
    const tokenAccount = makeTokenAccount(Array.from({ length: 14 }, () => makeRecord(ONE_ALEO)));
    const tokenTransaction = makeAleoTransaction({
      mode: TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE,
      subAccountId: tokenAccount.id,
      properties: { amountRecordCommitments: [], feeRecordCommitment: null },
    });

    renderSync(tokenTransaction, { ...ALEO_MAIN_ACCOUNT, subAccounts: [] });

    completeSync({ ...withRecords([]), subAccounts: [tokenAccount] });

    expect(screen.getByText("You can send up to 13 TAT")).toBeVisible();
    expect(screen.getByText(/one transaction can use a maximum of 13\./)).toBeVisible();
    expect(mockOnComplete).not.toHaveBeenCalled();
  });
});
