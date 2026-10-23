import React from "react";
import BigNumber from "bignumber.js";
import { act, render, screen } from "@tests/test-renderer";
import type { Account } from "@ledgerhq/types-live";
import type { AleoAccount, Transaction } from "@ledgerhq/live-common/families/aleo/types";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import { ALEO_ACCOUNT_1, ALEO_TOKEN_ACCOUNT_1, makeAleoAccount } from "../__mocks__/account.mock";
import { makeRecord } from "../__mocks__/record.mock";
import { useAleoPrivateSync } from "../hooks/useAleoPrivateSync";
import aleoSendBalanceTypeSync from "../SendBalanceTypeSync";

jest.mock("../hooks/useAleoPrivateSync");

const mockedUseAleoPrivateSync = jest.mocked(useAleoPrivateSync);
const mockStart = jest.fn();
const mockOnComplete = jest.fn();
const mockOnClose = jest.fn();

const ONE_ALEO = 1_000_000;

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

const { Component: SyncComponent, isRequired } = aleoSendBalanceTypeSync;

function mockSync(state: { progress?: number; isSyncing?: boolean; error?: Error | null } = {}) {
  mockedUseAleoPrivateSync.mockReturnValue({
    progress: state.progress ?? 0,
    isSyncing: state.isSyncing ?? true,
    error: state.error ?? null,
    start: mockStart,
    stop: jest.fn(),
  });
}

function makeAccountWithRecords(microcredits: number[]): AleoAccount {
  return makeAleoAccount({
    unspentPrivateRecords: microcredits.map(makeRecord),
    provableApi: { scannerStatus: { synced: true, percentage: 100 } },
  } as never);
}

function completeSync(syncedAccount: Account) {
  const { onAccountUpdated } = mockedUseAleoPrivateSync.mock.calls.at(-1)![0];
  act(() => onAccountUpdated?.(syncedAccount));
}

function renderSync(
  transaction: Transaction = privateTransaction,
  account: Account = ALEO_ACCOUNT_1,
) {
  return render(
    <SyncComponent
      account={account}
      transaction={transaction}
      onComplete={mockOnComplete}
      onClose={mockOnClose}
    />,
  );
}

describe("aleoSendBalanceTypeSync", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSync();
  });

  it("GIVEN the public balance WHEN checked THEN no sync is required", () => {
    expect(isRequired({ account: ALEO_ACCOUNT_1, transaction: publicTransaction })).toBe(false);
  });

  it("GIVEN the private balance WHEN checked THEN a sync is required", () => {
    expect(isRequired({ account: ALEO_ACCOUNT_1, transaction: privateTransaction })).toBe(true);
  });

  it("GIVEN the sync step WHEN rendered THEN it starts a sync that survives the screen", () => {
    renderSync();

    expect(mockedUseAleoPrivateSync).toHaveBeenCalledWith(
      expect.objectContaining({
        account: ALEO_ACCOUNT_1,
        autoStart: true,
        keepAliveOnUnmount: true,
      }),
    );
  });

  it("GIVEN a running sync WHEN rendered THEN the progress is shown and the flow waits", () => {
    mockSync({ progress: 42.4 });

    renderSync();

    expect(screen.getByText("Refreshing your private balance")).toBeOnTheScreen();
    expect(screen.getByText("42%")).toBeOnTheScreen();
    expect(mockOnComplete).not.toHaveBeenCalled();
  });

  it("GIVEN a failed sync WHEN try again is pressed THEN the sync restarts", async () => {
    mockSync({ isSyncing: false, error: new Error("sync failed") });

    const { user } = renderSync();

    expect(screen.getByText("Private sync failed")).toBeOnTheScreen();

    await user.press(screen.getByText("Try again"));

    expect(mockStart).toHaveBeenCalledTimes(1);
    expect(mockOnComplete).not.toHaveBeenCalled();
  });

  it("GIVEN a failed sync WHEN cancel is pressed THEN the flow closes", async () => {
    mockSync({ isSyncing: false, error: new Error("sync failed") });

    const { user } = renderSync();

    await user.press(screen.getByText("Cancel"));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnComplete).not.toHaveBeenCalled();
  });

  it("GIVEN the flow was closed WHEN the sync finishes THEN the flow does not move on", () => {
    const { unmount } = renderSync();

    unmount();
    completeSync(makeAccountWithRecords([ONE_ALEO]));

    expect(mockOnComplete).not.toHaveBeenCalled();
  });

  it("GIVEN one transaction can use every record WHEN synced THEN the flow moves on", () => {
    renderSync();

    completeSync(makeAccountWithRecords(Array.from({ length: 14 }, () => ONE_ALEO)));

    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });

  it("GIVEN zero-value records WHEN synced THEN they do not count against the limit", () => {
    renderSync();

    completeSync(makeAccountWithRecords([...Array.from({ length: 14 }, () => ONE_ALEO), 0, 0]));

    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });

  it("GIVEN a scanner reset WHEN the account updates THEN the flow waits for the sync error", () => {
    renderSync();

    completeSync({
      ...makeAccountWithRecords([ONE_ALEO]),
      aleoResources: { ...makeAccountWithRecords([ONE_ALEO]).aleoResources!, provableApi: null },
    } as AleoAccount);

    expect(mockOnComplete).not.toHaveBeenCalled();
  });

  it("GIVEN more records than one transaction can use WHEN synced THEN it warns how much can be sent", async () => {
    const { user } = renderSync();

    completeSync(
      makeAccountWithRecords([...Array.from({ length: 14 }, () => ONE_ALEO), ONE_ALEO / 2]),
    );

    expect(screen.getByText("You can send up to 14 ALEO")).toBeOnTheScreen();
    expect(screen.getByText(/one transaction can use a maximum of 14\./)).toBeOnTheScreen();
    expect(mockOnComplete).not.toHaveBeenCalled();

    await user.press(screen.getByText("Continue"));

    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });

  it("GIVEN a token send WHEN synced THEN its records are checked against the token limit", () => {
    const tokenAccount = {
      ...ALEO_TOKEN_ACCOUNT_1,
      unspentPrivateRecords: Array.from({ length: 14 }, () => makeRecord(ONE_ALEO)),
    };
    const tokenTransaction = {
      ...privateTransaction,
      mode: TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE,
      subAccountId: tokenAccount.id,
    } as Transaction;

    renderSync(tokenTransaction);

    completeSync({ ...makeAccountWithRecords([]), subAccounts: [tokenAccount] });

    expect(screen.getByText("You can send up to 13 USAD")).toBeOnTheScreen();
    expect(screen.getByText(/one transaction can use a maximum of 13\./)).toBeOnTheScreen();
    expect(mockOnComplete).not.toHaveBeenCalled();
  });
});
