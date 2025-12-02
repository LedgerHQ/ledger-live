import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import { HEDERA_TRANSACTION_MODES } from "./constants";
import getDeviceTransactionConfig from "./deviceTransactionConfig";
import type { Transaction, TransactionStatus } from "./types";

describe("getDeviceTransactionConfig", () => {
  const mockAccount = {
    id: "mock-account-id",
    currency: { id: "hedera" },
  } as Account;

  const createMockStatus = (estimatedFees: BigNumber): TransactionStatus => ({
    errors: {},
    warnings: {},
    estimatedFees,
    amount: new BigNumber(0),
    totalSpent: new BigNumber(0),
  });

  describe("staking transactions", () => {
    it("should return correct fields for ClaimRewards transaction", async () => {
      const transaction = {
        family: "hedera",
        mode: HEDERA_TRANSACTION_MODES.ClaimRewards,
        amount: new BigNumber(0),
        recipient: "",
        memo: "Claiming rewards",
      } as Transaction;

      const status = createMockStatus(new BigNumber(100000));

      const fields = await getDeviceTransactionConfig({
        account: mockAccount,
        transaction,
        status,
      });

      expect(fields).toEqual([
        {
          type: "text",
          label: "Method",
          value: "Claim Rewards",
        },
        {
          label: "Fees",
          type: "fees",
        },
        {
          type: "text",
          label: "Memo",
          value: "Claiming rewards",
        },
      ]);
    });

    it("should return correct fields for Delegate transaction", async () => {
      const transaction = {
        family: "hedera",
        mode: HEDERA_TRANSACTION_MODES.Delegate,
        amount: new BigNumber(0),
        recipient: "",
        properties: {
          stakingNodeId: 10,
        },
      } as Transaction;

      const status = createMockStatus(new BigNumber(100000));

      const fields = await getDeviceTransactionConfig({
        account: mockAccount,
        transaction,
        status,
      });

      expect(fields).toEqual([
        {
          type: "text",
          label: "Method",
          value: "Update Account",
        },
        {
          label: "Fees",
          type: "fees",
        },
        {
          type: "text",
          label: "Staked Node ID",
          value: "10",
        },
      ]);
    });

    it("should not include staking node ID if not provided", async () => {
      const transaction = {
        family: "hedera",
        mode: HEDERA_TRANSACTION_MODES.Undelegate,
        amount: new BigNumber(0),
        recipient: "",
        properties: {},
      } as Transaction;

      const status = createMockStatus(new BigNumber(100000));

      const fields = await getDeviceTransactionConfig({
        account: mockAccount,
        transaction,
        status,
      });

      expect(fields).toEqual([
        {
          type: "text",
          label: "Method",
          value: "Update Account",
        },
        {
          label: "Fees",
          type: "fees",
        },
      ]);
    });
  });

  describe("token associate transactions", () => {
    it("should return correct fields for TokenAssociate transaction", async () => {
      const transaction = {
        family: "hedera",
        mode: HEDERA_TRANSACTION_MODES.TokenAssociate,
        amount: new BigNumber(0),
        recipient: "",
        subAccountId: "token-account-id",
        memo: "Associating token",
      } as Transaction;

      const status = createMockStatus(new BigNumber(50000));

      const fields = await getDeviceTransactionConfig({
        account: mockAccount,
        transaction,
        status,
      });

      expect(fields).toEqual([
        {
          type: "text",
          label: "Method",
          value: "Associate Token",
        },
        {
          type: "fees",
          label: "Fees",
        },
        {
          type: "text",
          label: "Memo",
          value: "Associating token",
        },
      ]);
    });

    it("should not include fees if they are zero", async () => {
      const transaction = {
        family: "hedera",
        mode: HEDERA_TRANSACTION_MODES.TokenAssociate,
        amount: new BigNumber(0),
        recipient: "",
        subAccountId: "token-account-id",
      } as Transaction;

      const status = createMockStatus(new BigNumber(0));

      const fields = await getDeviceTransactionConfig({
        account: mockAccount,
        transaction,
        status,
      });

      expect(fields).toEqual([
        {
          type: "text",
          label: "Method",
          value: "Associate Token",
        },
      ]);
    });
  });

  describe("regular transfer transactions", () => {
    it("should return correct fields for regular Send transaction", async () => {
      const transaction = {
        family: "hedera",
        mode: HEDERA_TRANSACTION_MODES.Send,
        amount: new BigNumber(1000000),
        recipient: "0.0.12345",
        useAllAmount: false,
        memo: "Payment",
      } as Transaction;

      const status = createMockStatus(new BigNumber(100000));

      const fields = await getDeviceTransactionConfig({
        account: mockAccount,
        transaction,
        status,
      });

      expect(fields).toEqual([
        {
          type: "text",
          label: "Method",
          value: "Transfer",
        },
        {
          type: "amount",
          label: "Amount",
        },
        {
          type: "fees",
          label: "Fees",
        },
        {
          type: "text",
          label: "Memo",
          value: "Payment",
        },
      ]);
    });

    it("should show 'Transfer All' method when useAllAmount is true", async () => {
      const transaction = {
        family: "hedera",
        mode: HEDERA_TRANSACTION_MODES.Send,
        amount: new BigNumber(0),
        recipient: "0.0.12345",
        useAllAmount: true,
      } as Transaction;

      const status = createMockStatus(new BigNumber(100000));

      const fields = await getDeviceTransactionConfig({
        account: mockAccount,
        transaction,
        status,
      });

      expect(fields[0]).toEqual({
        type: "text",
        label: "Method",
        value: "Transfer All",
      });
    });

    it("should include gas limit for Send transactions with gasLimit", async () => {
      const transaction = {
        family: "hedera",
        mode: HEDERA_TRANSACTION_MODES.Send,
        amount: new BigNumber(1000000),
        recipient: "0.0.12345",
        useAllAmount: false,
        gasLimit: new BigNumber(300000),
      } as Transaction;

      const status = createMockStatus(new BigNumber(100000));

      const fields = await getDeviceTransactionConfig({
        account: mockAccount,
        transaction,
        status,
      });

      expect(fields).toEqual([
        {
          type: "text",
          label: "Method",
          value: "Transfer",
        },
        {
          type: "amount",
          label: "Amount",
        },
        {
          type: "fees",
          label: "Fees",
        },
        {
          type: "text",
          label: "Gas Limit",
          value: "300000",
        },
      ]);
    });

    it("should not include memo if not provided", async () => {
      const transaction = {
        family: "hedera",
        mode: HEDERA_TRANSACTION_MODES.Send,
        amount: new BigNumber(1000000),
        recipient: "0.0.12345",
        useAllAmount: false,
      } as Transaction;

      const status = createMockStatus(new BigNumber(100000));

      const fields = await getDeviceTransactionConfig({
        account: mockAccount,
        transaction,
        status,
      });

      expect(fields).toHaveLength(3);
      expect(fields.some(f => f.label === "Memo")).toBe(false);
    });
  });
});
