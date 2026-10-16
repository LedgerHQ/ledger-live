import React from "react";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { Account, Operation } from "@ledgerhq/types-live";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import { openModal } from "~/renderer/actions/modals";
import { OperationDetails } from "..";

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({
    isEditableOperation: () => true,
    isStuckOperation: () => false,
  }),
}));

jest.mock("~/renderer/families", () => ({
  useLLDCoinFamily: () => ({}),
}));

jest.mock("~/renderer/actions/modals", () => ({
  ...jest.requireActual("~/renderer/actions/modals"),
  openModal: jest.fn(),
}));

const baseAccount = genAccount("operation-details-bitcoin-account", {
  currency: getCryptoCurrencyById("bitcoin"),
  operationsSize: 0,
});

const pendingOperation = (transactionRaw?: Operation["transactionRaw"]): Operation => ({
  id: "operation-details-pending-op",
  hash: "pending-hash",
  type: "OUT",
  value: new BigNumber(1000),
  fee: new BigNumber(100),
  senders: [baseAccount.freshAddress],
  recipients: ["bc1qrecipient"],
  blockHeight: null,
  blockHash: null,
  accountId: baseAccount.id,
  date: new Date(),
  extra: {},
  ...(transactionRaw ? { transactionRaw } : {}),
});

const renderDrawer = (operation: Operation) => {
  const account: Account = {
    ...baseAccount,
    operations: [operation],
    pendingOperations: [operation],
  };
  return {
    account,
    ...render(<OperationDetails operationId={operation.id} accountId={account.id} />, {
      initialState: {
        accounts: [account],
        ...withFlagOverrides({
          editBitcoinTx: { enabled: true, params: { supportedCurrencyIds: ["bitcoin"] } },
        }),
      },
    }),
  };
};

describe("OperationDetails drawer — bitcoin edit", () => {
  beforeEach(() => {
    (openModal as jest.Mock).mockImplementation((modal: string, data: unknown) => ({
      type: "openModal",
      payload: { modal, data },
    }));
  });

  it("opens the edit modal replacing an operation sent elsewhere", async () => {
    const { user, account } = renderDrawer(pendingOperation());

    await user.click(screen.getByText("Speed up or Cancel"));

    expect(openModal).toHaveBeenCalledWith(
      "MODAL_BITCOIN_EDIT_TRANSACTION",
      expect.objectContaining({
        transactionRaw: {
          family: "bitcoin",
          amount: "0",
          recipient: account.freshAddress,
          familySpecificData: {
            rbf: true,
            utxoStrategy: { strategy: 0, excludeUTXOs: [] },
            replaceTxId: "pending-hash",
          },
        },
        transactionHash: "pending-hash",
      }),
    );
  });

  it("opens the edit modal replacing the operation, not the one its transaction replaced", async () => {
    const transactionRaw = {
      family: "bitcoin",
      amount: "1000",
      recipient: "bc1qrecipient",
      familySpecificData: { rbf: true, feePerByte: "3", replaceTxId: "older-hash" },
    };
    const { user } = renderDrawer(pendingOperation(transactionRaw));

    await user.click(screen.getByText("Speed up or Cancel"));

    expect(openModal).toHaveBeenCalledWith(
      "MODAL_BITCOIN_EDIT_TRANSACTION",
      expect.objectContaining({
        transactionRaw: {
          ...transactionRaw,
          familySpecificData: { rbf: true, feePerByte: "3", replaceTxId: "pending-hash" },
        },
      }),
    );
  });
});
