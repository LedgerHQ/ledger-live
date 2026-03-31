/* eslint-disable @typescript-eslint/consistent-type-assertions */
jest.mock("@ledgerhq/ledger-wallet-framework/account/accountId");
jest.mock("@ledgerhq/ledger-wallet-framework/bridge/jsHelpers");
jest.mock("@ledgerhq/ledger-wallet-framework/operation");
jest.mock("../network");
jest.mock("../config");
jest.mock("../logic/account/getAccount");
jest.mock("../logic/account/getDelegateAddress");
jest.mock("../logic/history/getBlockInfo");
jest.mock("../logic/history/getTransactions");

import { encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/accountId";
import { AccountShapeInfo, mergeOps } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { Account } from "@ledgerhq/types-live/account";
import BigNumber from "bignumber.js";
import { getAccount } from "../logic/account/getAccount";
import { getDelegateAddress } from "../logic/account/getDelegateAddress";
import { getBlockInfo } from "../logic/history/getBlockInfo";
import { getTransactions } from "../logic/history/getTransactions";
import { fetchValidators, getEpochInfo } from "../network";
import type { RosettaTransaction } from "../network/types";
import type { FetchEpochInfoResponse } from "../network/types";
import {
  createMockTxn,
  createMockAccountInfo,
  mockBlockInfo,
  mockAccountData,
} from "../test/fixtures";
import type { MinaAccount, MinaAccountRaw, MinaOperation } from "../types";
import {
  getAccountShape,
  mapRosettaTxnToOperation,
  assignToAccountRaw,
  assignFromAccountRaw,
} from "./synchronisation";

describe("synchronisation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("mapRosettaTxnToOperation", () => {
    const mockAccountId = "account_id";
    const mockAddress = "sender_address";

    beforeEach(() => {
      jest.spyOn({ getBlockInfo }, "getBlockInfo").mockResolvedValue(mockBlockInfo);
      jest
        .spyOn({ encodeOperationId }, "encodeOperationId")
        .mockReturnValue("encoded_operation_id");
    });

    it("should map payment transaction (OUT)", async () => {
      const mockTxn = createMockTxn({
        type: "OUT",
        senderAddress: mockAddress,
        receiverAddress: "receiver_address",
        status: "Success",
      });

      const result = await mapRosettaTxnToOperation(mockAccountId, mockAddress, mockTxn);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "encoded_operation_id",
        type: "OUT",
        hash: "tx_hash",
        value: new BigNumber(900),
        fee: new BigNumber(-100),
        blockHeight: 123,
        hasFailed: false,
        blockHash: "block_hash",
        accountId: mockAccountId,
        senders: [mockAddress],
        recipients: ["receiver_address"],
        date: new Date(1672531200000),
        extra: {
          memo: "test memo",
          accountCreationFee: "0",
        },
      });
    });

    it("should map payment transaction (IN)", async () => {
      const mockTxn = createMockTxn({
        type: "IN",
        senderAddress: "sender_other",
        receiverAddress: mockAddress,
        status: "Success",
      });

      const result = await mapRosettaTxnToOperation(mockAccountId, mockAddress, mockTxn);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "encoded_operation_id",
        type: "IN",
        hash: "tx_hash",
        value: new BigNumber(1000),
        fee: new BigNumber(-100),
        blockHeight: 123,
        hasFailed: false,
        blockHash: "block_hash",
        accountId: mockAccountId,
        senders: ["sender_other"],
        recipients: [mockAddress],
        date: new Date(1672531200000),
        extra: {
          memo: "test memo",
          accountCreationFee: "0",
        },
      });
    });

    it("should map redelegate transaction", async () => {
      const mockTxn = createMockTxn({
        type: "REDELEGATE",
        senderAddress: mockAddress,
        receiverAddress: "not_used",
        memo: "redelegate",
        status: "Success",
      });

      const result = await mapRosettaTxnToOperation(mockAccountId, mockAddress, mockTxn);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "encoded_operation_id",
        type: "REDELEGATE",
        hash: "tx_hash",
        value: new BigNumber(0),
        fee: new BigNumber(0),
        blockHeight: 123,
        hasFailed: false,
        blockHash: "block_hash",
        accountId: mockAccountId,
        senders: [mockAddress],
        recipients: ["unknown"],
        date: new Date(1672531200000),
        extra: {
          memo: "redelegate",
          accountCreationFee: "0",
        },
      });
    });

    it("should map undelegate transaction (self-delegation)", async () => {
      const mockTxn = createMockTxn({
        type: "REDELEGATE",
        senderAddress: mockAddress,
        receiverAddress: "not_used",
        memo: "undelegate",
        status: "Success",
      });
      // Override the delegate_change operation to have delegate_change_target = sender (self-delegation)
      mockTxn.transaction.operations[0].metadata = { delegate_change_target: mockAddress };

      const result = await mapRosettaTxnToOperation(mockAccountId, mockAddress, mockTxn);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("UNDELEGATE");
      expect(result[0].recipients).toEqual([mockAddress]);
    });

    it("should handle failed transactions", async () => {
      const mockTxn = createMockTxn({
        type: "OUT",
        senderAddress: mockAddress,
        receiverAddress: "receiver_address",
        status: "Failed",
        memo: "failed",
      });

      const result = await mapRosettaTxnToOperation(mockAccountId, mockAddress, mockTxn);

      expect(result).toHaveLength(1);
      expect(result[0].hasFailed).toBe(true);
    });

    it("should map zkapp transaction (zkapp_fee_payer_dec + zkapp_balance_update)", async () => {
      const zkappTxn: RosettaTransaction = {
        transaction: {
          transaction_identifier: { hash: "tx_hash" },
          operations: [
            {
              operation_identifier: { index: 0 },
              type: "zkapp_fee_payer_dec",
              status: "Success",
              account: { address: "zkapp_sender", metadata: { token_id: "MINA" } },
            },
            {
              operation_identifier: { index: 1 },
              type: "zkapp_balance_update",
              status: "Success",
              account: { address: mockAddress, metadata: { token_id: "MINA" } },
              amount: { value: "500", currency: { symbol: "MINA", decimals: 9 } },
            },
          ],
          metadata: { memo: "" },
        },
        block_identifier: { index: 123, hash: "block_hash" },
        timestamp: 1672531200000,
      };

      const result = await mapRosettaTxnToOperation(mockAccountId, mockAddress, zkappTxn);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("IN");
      expect(result[0].senders).toEqual(["zkapp_sender"]);
      expect(result[0].recipients).toEqual([mockAddress]);
      expect(result[0].value).toEqual(new BigNumber(500));
    });

    it("should handle account_creation_fee_via_payment", async () => {
      const mockTxn = createMockTxn({
        type: "OUT",
        senderAddress: mockAddress,
        receiverAddress: "receiver_address",
        status: "Success",
      });
      mockTxn.transaction.operations.push({
        operation_identifier: { index: 3 },
        type: "account_creation_fee_via_payment",
        status: "Success",
        account: { address: mockAddress, metadata: { token_id: "MINA" } },
        amount: { value: "100000000", currency: { symbol: "MINA", decimals: 9 } },
      });

      const result = await mapRosettaTxnToOperation(mockAccountId, mockAddress, mockTxn);

      expect(result).toHaveLength(1);
      expect(result[0].extra.accountCreationFee).toBe("-100000000");
    });

    it("should set transactionSequenceNumber when nonce is defined in metadata", async () => {
      const mockTxn = createMockTxn({
        type: "OUT",
        senderAddress: mockAddress,
        receiverAddress: "receiver_address",
        status: "Success",
      });
      // Add nonce to metadata
      mockTxn.transaction.metadata = { memo: "test", nonce: 7 };

      const result = await mapRosettaTxnToOperation(mockAccountId, mockAddress, mockTxn);

      expect(result).toHaveLength(1);
      expect(result[0].transactionSequenceNumber).toEqual(new BigNumber(7));
    });

    it("should return empty array when invariant fails (catch block)", async () => {
      // A txn with only payment_receiver_inc has no fromAccount set → invariant throws
      const invalidTxn: RosettaTransaction = {
        transaction: {
          transaction_identifier: { hash: "tx_hash" },
          operations: [
            {
              operation_identifier: { index: 0 },
              type: "payment_receiver_inc",
              status: "Success",
              account: { address: "receiver", metadata: { token_id: "MINA" } },
              amount: { value: "1000", currency: { symbol: "MINA", decimals: 9 } },
            },
          ],
          metadata: {},
        },
        block_identifier: { index: 123, hash: "block_hash" },
        timestamp: 1672531200000,
      };

      const result = await mapRosettaTxnToOperation(mockAccountId, mockAddress, invalidTxn);

      expect(result).toEqual([]);
    });
  });

  describe("getAccountShape", () => {
    beforeEach(() => {
      jest.spyOn({ encodeAccountId }, "encodeAccountId").mockReturnValue("account_id");
      jest.spyOn({ getAccount }, "getAccount").mockResolvedValue(mockAccountData);
      jest.spyOn({ getTransactions }, "getTransactions").mockResolvedValue([]);
      jest.spyOn({ mergeOps }, "mergeOps").mockReturnValue([]);
      jest.spyOn({ getDelegateAddress }, "getDelegateAddress").mockResolvedValue("test_address");
      jest.spyOn({ getEpochInfo }, "getEpochInfo").mockResolvedValue({
        data: {
          daemonStatus: {
            consensusTimeNow: {
              epoch: "1",
              slot: "100",
              globalSlot: "0",
              startTime: "",
              endTime: "",
            },
          },
        },
      } satisfies FetchEpochInfoResponse);
      jest.spyOn({ fetchValidators }, "fetchValidators").mockResolvedValue([]);
    });

    it("should handle missing initialAccount (oldOperations defaults to empty array)", async () => {
      const mockInfo = { ...createMockAccountInfo(), initialAccount: undefined };
      const result = await getAccountShape(mockInfo as AccountShapeInfo<Account>, {
        paginationConfig: {},
      });

      expect(result.operationsCount).toBe(0);
      expect(result.operations).toEqual([]);
    });

    it("should get account shape with correct data", async () => {
      const mockInfo = createMockAccountInfo();
      const result = await getAccountShape(mockInfo, {
        paginationConfig: {
          operationsPerAccountId: {
            account_id: 10,
          },
        },
      });

      expect(encodeAccountId).toHaveBeenCalledWith({
        type: "js",
        version: "2",
        currencyId: "mina",
        xpubOrAddress: "test_address",
        derivationMode: "minabip44",
      });

      expect(getAccount).toHaveBeenCalledWith("test_address");
      expect(getTransactions).toHaveBeenCalledWith("test_address");

      expect(result).toEqual({
        id: "account_id",
        balance: mockAccountData.balance,
        spendableBalance: mockAccountData.spendableBalance,
        blockHeight: mockAccountData.blockHeight,
        operationsCount: 0,
        operations: [],
        resources: {
          blockProducers: [],
          delegateInfo: undefined,
          stakingActive: false,
          epochInfo: {
            epoch: "1",
            slot: "100",
            globalSlot: "0",
            startTime: "",
            endTime: "",
          },
        },
      });
    });

    it("should include operations returned by mergeOps in the account shape", async () => {
      const txn = createMockTxn({
        type: "IN",
        senderAddress: "other_address",
        receiverAddress: "test_address",
        status: "Success",
      });
      (getTransactions as jest.Mock).mockResolvedValue([txn]);
      const fakeOp = { type: "IN", id: "op1" } as MinaOperation;
      (mergeOps as jest.Mock).mockReturnValue([fakeOp]);

      const mockInfo = createMockAccountInfo();
      const result = await getAccountShape(mockInfo, { paginationConfig: {} });

      expect(result.operationsCount).toBe(1);
      expect(result.operations).toEqual([fakeOp]);
    });

    it("should determine staking from the most recent delegation op when graphQL delegate is unavailable", async () => {
      (mergeOps as jest.Mock).mockReturnValue([
        { type: "REDELEGATE", recipients: ["validator_address"] } as MinaOperation,
      ]);
      (getDelegateAddress as jest.Mock).mockResolvedValue(null);

      const mockInfo = createMockAccountInfo();
      const result = await getAccountShape(mockInfo, { paginationConfig: {} });

      expect(result.resources?.stakingActive).toBe(true);
    });

    it("should populate delegateInfo when a validator matches the delegate address", async () => {
      (fetchValidators as jest.Mock).mockResolvedValue([
        { address: "validator_address", name: "Validator" },
      ]);
      (getDelegateAddress as jest.Mock).mockResolvedValue("validator_address");

      const mockInfo = createMockAccountInfo();
      const result = await getAccountShape(mockInfo, { paginationConfig: {} });

      expect(result.resources?.delegateInfo).toEqual({
        address: "validator_address",
        name: "Validator",
      });
    });

    it("should use graphQL delegate address when it differs from account address", async () => {
      (getDelegateAddress as jest.Mock).mockResolvedValue("external_validator");
      (mergeOps as jest.Mock).mockReturnValue([]);

      const mockInfo = createMockAccountInfo();
      const result = await getAccountShape(mockInfo, { paginationConfig: {} });

      // graphqlDelegateAddress = "external_validator" !== "test_address" → use it directly
      expect(result.resources?.stakingActive).toBe(true);
    });

    it("should resolve to self-address when last delegation op is UNDELEGATE", async () => {
      (getDelegateAddress as jest.Mock).mockResolvedValue(null);
      (mergeOps as jest.Mock).mockReturnValue([
        { type: "UNDELEGATE", recipients: ["test_address"] } as MinaOperation,
      ]);

      const mockInfo = createMockAccountInfo();
      const result = await getAccountShape(mockInfo, { paginationConfig: {} });

      // delegateAddress = address (self) → stakingActive = false
      expect(result.resources?.stakingActive).toBe(false);
    });
  });

  describe("assignToAccountRaw", () => {
    it("should copy resources from account to accountRaw", () => {
      const resources: MinaAccount["resources"] = {
        blockProducers: [],
        delegateInfo: undefined,
        stakingActive: false,
        epochInfo: { epoch: "1", slot: "100", globalSlot: "0", startTime: "", endTime: "" },
      };
      const account = { resources } as MinaAccount;
      const accountRaw = {} as MinaAccountRaw;

      assignToAccountRaw(account, accountRaw);

      expect(accountRaw.resources).toBe(resources);
    });

    it("should not modify accountRaw when account has no resources", () => {
      const account = {} as MinaAccount;
      const accountRaw = {} as MinaAccountRaw;

      assignToAccountRaw(account, accountRaw);

      expect(accountRaw.resources).toBeUndefined();
    });
  });

  describe("assignFromAccountRaw", () => {
    it("should copy resources from accountRaw to account", () => {
      const resources: MinaAccount["resources"] = {
        blockProducers: [],
        delegateInfo: undefined,
        stakingActive: true,
        epochInfo: { epoch: "2", slot: "50", globalSlot: "0", startTime: "", endTime: "" },
      };
      const accountRaw = { resources } as MinaAccountRaw;
      const account = {} as MinaAccount;

      assignFromAccountRaw(accountRaw, account);

      expect(account.resources).toBe(resources);
    });

    it("should not modify account when accountRaw has no resources", () => {
      const accountRaw = {} as MinaAccountRaw;
      const account = {} as MinaAccount;

      assignFromAccountRaw(accountRaw, account);

      expect(account.resources).toBeUndefined();
    });
  });
});
