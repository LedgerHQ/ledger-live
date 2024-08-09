import BigNumber from "bignumber.js";
import getDeviceTransactionConfig from "../../deviceTransactionConfig";
import {
  account,
  transaction as baseTransaction,
  jettonTransaction,
} from "../fixtures/common.fixtures";

const status = {
  errors: {},
  warnings: {},
  estimatedFees: new BigNumber(0),
  amount: new BigNumber(0),
  totalSpent: new BigNumber(0),
};

describe("deviceTransactionConfig", () => {
  describe("TON transaction", () => {
    it("should return the fields for a transaction when there is a valid comment", async () => {
      const transaction = {
        ...baseTransaction,
        comment: { isEncrypted: false, text: "validComment" },
      };
      const res = await getDeviceTransactionConfig({
        account: account,
        parentAccount: undefined,
        transaction,
        status,
      });
      expect(res).toEqual([
        {
          type: "address",
          label: "To",
          address: transaction.recipient,
        },
        {
          type: "amount",
          label: "Amount",
        },
        { type: "fees", label: "Fee" },
        { type: "text", label: "Comment", value: "validComment" },
      ]);
    });

    it("should return the fields for a transaction when useAllAmount is true and there is a valid comment", async () => {
      const transaction = {
        ...baseTransaction,
        useAllAmount: true,
        comment: { isEncrypted: false, text: "validComment" },
      };
      const res = await getDeviceTransactionConfig({
        account: account,
        parentAccount: undefined,
        transaction,
        status,
      });
      expect(res).toEqual([
        {
          type: "address",
          label: "To",
          address: transaction.recipient,
        },
        {
          type: "text",
          label: "Amount",
          value: "ALL YOUR TONs",
        },
        { type: "fees", label: "Fee" },
        { type: "text", label: "Comment", value: "validComment" },
      ]);
    });
  });

  describe("Jetton transaction", () => {
    it("should return the fields for a jetton transaction", async () => {
      if (account.subAccounts?.[0]) {
        const res = await getDeviceTransactionConfig({
          account: account.subAccounts[0],
          parentAccount: account,
          transaction: jettonTransaction,
          status,
        });
        expect(res).toEqual([
          {
            type: "address",
            label: "To",
            address: jettonTransaction.recipient,
          },
          {
            type: "text",
            label: "Jetton units",
            value: jettonTransaction.amount.toString(),
          },
          { type: "fees", label: "Fee" },
        ]);
      }
    });
  });
});
