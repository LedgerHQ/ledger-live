/**
 * @jest-environment jsdom
 */
import React from "react";
import BigNumber from "bignumber.js";
import { Dialog, DialogContent } from "@ledgerhq/lumen-ui-react";
import { render, screen } from "tests/testSetup";
import type { AleoAccount, Transaction } from "@ledgerhq/live-common/families/aleo/types";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import { ALEO_MAIN_ACCOUNT } from "../__mocks__/account.mock";
import { useAleoPrivateSync } from "../hooks/useAleoPrivateSync";
import { AleoBalanceTypeSync } from "../AleoBalanceTypeSync";

jest.mock("../hooks/useAleoPrivateSync", () => ({
  useAleoPrivateSync: jest.fn(),
}));

const mockedUseAleoPrivateSync = jest.mocked(useAleoPrivateSync);
const mockStart = jest.fn();
const mockOnComplete = jest.fn();
const mockOnCancel = jest.fn();

const account = ALEO_MAIN_ACCOUNT;

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

function renderSync(transaction: Transaction, syncedAccount: AleoAccount = account) {
  return render(
    <Dialog open>
      <DialogContent aria-describedby={undefined}>
        <AleoBalanceTypeSync
          account={syncedAccount}
          transaction={transaction}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      </DialogContent>
    </Dialog>,
  );
}

beforeEach(() => jest.clearAllMocks());

describe("AleoBalanceTypeSync", () => {
  it("moves on straight away when the public balance is picked", () => {
    mockSync({});

    renderSync(publicTransaction);

    expect(mockedUseAleoPrivateSync).not.toHaveBeenCalled();
    expect(screen.queryByTestId("aleo-private-sync")).toBeNull();
    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });

  it("starts a private sync and shows its progress for a private send", () => {
    mockSync({ progress: 42, isSyncing: true });

    renderSync(privateTransaction);

    expect(mockedUseAleoPrivateSync).toHaveBeenCalledWith(
      expect.objectContaining({ account, autoStart: true, keepAliveOnUnmount: true }),
    );
    expect(screen.getByText("Refreshing your private balance")).toBeVisible();
    expect(screen.getByText("This can take up to a minute")).toBeVisible();
    expect(screen.getByText("42% synced")).toBeVisible();
    expect(mockOnComplete).not.toHaveBeenCalled();
  });

  it("moves on once the sync has completed", () => {
    mockSync({ progress: 100, isSyncing: false });

    renderSync(privateTransaction);

    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });

  it("goes back to the balance choice when the sync is cancelled", async () => {
    mockSync({ progress: 10, isSyncing: true });

    const { user } = renderSync(privateTransaction);
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(mockOnCancel).toHaveBeenCalled();
    expect(mockOnComplete).not.toHaveBeenCalled();
  });

  it("offers a retry when the sync fails", async () => {
    mockSync({ error: new Error("boom") });

    const { user } = renderSync(privateTransaction);

    expect(screen.getByText("Private sync failed")).toBeVisible();
    expect(mockOnComplete).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(mockStart).toHaveBeenCalledTimes(1);
  });
});
