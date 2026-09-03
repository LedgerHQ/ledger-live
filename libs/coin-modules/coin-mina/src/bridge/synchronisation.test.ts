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
import type { FetchEpochInfoResponse, ValidatorInfo } from "../network/types";
import {
  createMockTxn,
  createMockAccountInfo,
  mockBlockInfo,
  mockAccountData,
} from "../test/fixtures";
import type { MinaAccount, MinaAccountRaw, MinaOperation } from "../types";
import {
  dropSupersededOperations,
  getAccountShape,
  mapRosettaTxnToOperation,
  refineDelegationTypes,
  assignToAccountRaw,
  assignFromAccountRaw,
} from "./synchronisation";

const storedOp = (id: string, hash: string): MinaOperation => ({ id, hash }) as MinaOperation;

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

    it("uses the provided block timestamp instead of fetching the block", async () => {
      const mockTxn = createMockTxn({
        type: "OUT",
        senderAddress: mockAddress,
        receiverAddress: "receiver_address",
        status: "Success",
      });
      // Rosetta /search/transactions does not return a per-tx timestamp in practice.
      delete (mockTxn as { timestamp?: number }).timestamp;

      const result = await mapRosettaTxnToOperation(
        mockAccountId,
        mockAddress,
        mockTxn,
        1700000000000,
      );

      // The pre-resolved block timestamp is used, without a per-tx getBlockInfo fetch.
      expect(result[0].date).toEqual(new Date(1700000000000));
      expect(getBlockInfo).not.toHaveBeenCalled();
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

    it("should map a delegate change to a delegate operation", async () => {
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
        type: "DELEGATE",
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
      (fetchValidators as unknown as jest.Mock).mockResolvedValue([
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

    describe("when a staking upstream fails", () => {
      const previousResources: MinaAccount["resources"] = {
        blockProducers: [{ address: "validator_address", name: "Validator" } as ValidatorInfo],
        delegateInfo: undefined,
        stakingActive: true,
        epochInfo: { epoch: "1", slot: "1", globalSlot: "1", startTime: "", endTime: "" },
      };

      it("should still return balance and operations", async () => {
        (fetchValidators as unknown as jest.Mock).mockRejectedValue(new Error("validators down"));
        const fakeOp = { type: "IN", id: "op1" } as MinaOperation;
        (mergeOps as jest.Mock).mockReturnValue([fakeOp]);

        const result = await getAccountShape(createMockAccountInfo(), { paginationConfig: {} });

        expect(result.balance).toEqual(mockAccountData.balance);
        expect(result.spendableBalance).toEqual(mockAccountData.spendableBalance);
        expect(result.blockHeight).toBe(mockAccountData.blockHeight);
        expect(result.operations).toEqual([fakeOp]);
      });

      it("should keep the resources from the previous sync", async () => {
        (fetchValidators as unknown as jest.Mock).mockRejectedValue(new Error("validators down"));
        const mockInfo = createMockAccountInfo();
        mockInfo.initialAccount = {
          ...mockInfo.initialAccount,
          resources: previousResources,
        } as MinaAccount;

        const result = await getAccountShape(mockInfo, { paginationConfig: {} });

        expect(result.resources).toEqual(previousResources);
      });

      it("should leave resources unset when there is nothing to fall back on", async () => {
        (getEpochInfo as jest.Mock).mockRejectedValue(new Error("graphql down"));
        const mockInfo = { ...createMockAccountInfo(), initialAccount: undefined };

        const result = await getAccountShape(mockInfo as AccountShapeInfo<Account>, {
          paginationConfig: {},
        });

        expect(result.resources).toBeUndefined();
        expect(result.balance).toEqual(mockAccountData.balance);
      });
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

  describe("refineDelegationTypes", () => {
    const accountId = "account_id";

    beforeEach(() => {
      (encodeOperationId as jest.Mock).mockImplementation(
        (id: string, hash: string, type: string) => `${id}-${hash}-${type}`,
      );
    });

    const delegationOp = (
      overrides: Partial<MinaOperation> & Pick<MinaOperation, "type" | "hash" | "date">,
    ): MinaOperation =>
      ({
        id: `${accountId}-${overrides.hash}-${overrides.type}`,
        accountId,
        hasFailed: false,
        recipients: ["validator_1"],
        senders: ["sender_address"],
        ...overrides,
      }) as MinaOperation;

    it("leaves a lone delegation as a first delegation", () => {
      const ops = [delegationOp({ type: "DELEGATE", hash: "tx1", date: new Date(1000) })];

      expect(refineDelegationTypes(ops).map(op => op.type)).toEqual(["DELEGATE"]);
    });

    it("promotes every delegation after the first one to a redelegation", () => {
      const ops = [
        delegationOp({ type: "DELEGATE", hash: "tx3", date: new Date(3000) }),
        delegationOp({ type: "DELEGATE", hash: "tx2", date: new Date(2000) }),
        delegationOp({ type: "DELEGATE", hash: "tx1", date: new Date(1000) }),
      ];

      const byHash = new Map(refineDelegationTypes(ops).map(op => [op.hash, op.type]));

      expect(byHash.get("tx1")).toBe("DELEGATE");
      expect(byHash.get("tx2")).toBe("REDELEGATE");
      expect(byHash.get("tx3")).toBe("REDELEGATE");
    });

    it("re-encodes the operation id of the operations it promotes", () => {
      const ops = [
        delegationOp({ type: "DELEGATE", hash: "tx1", date: new Date(1000) }),
        delegationOp({ type: "DELEGATE", hash: "tx2", date: new Date(2000) }),
      ];

      const [first, second] = refineDelegationTypes(ops);

      expect(first.id).toBe("account_id-tx1-DELEGATE");
      expect(second.id).toBe("account_id-tx2-REDELEGATE");
    });

    it("treats a delegation following an undelegation as a first delegation again", () => {
      const ops = [
        delegationOp({ type: "DELEGATE", hash: "tx1", date: new Date(1000) }),
        delegationOp({ type: "UNDELEGATE", hash: "tx2", date: new Date(2000) }),
        delegationOp({ type: "DELEGATE", hash: "tx3", date: new Date(3000) }),
      ];

      expect(refineDelegationTypes(ops).map(op => op.type)).toEqual([
        "DELEGATE",
        "UNDELEGATE",
        "DELEGATE",
      ]);
    });

    it("does not let a failed delegation start a delegation", () => {
      const ops = [
        delegationOp({ type: "DELEGATE", hash: "tx1", date: new Date(1000), hasFailed: true }),
        delegationOp({ type: "DELEGATE", hash: "tx2", date: new Date(2000) }),
      ];

      expect(refineDelegationTypes(ops).map(op => op.type)).toEqual(["DELEGATE", "DELEGATE"]);
    });

    it("does not let a failed undelegation clear the delegation", () => {
      const ops = [
        delegationOp({ type: "DELEGATE", hash: "tx1", date: new Date(1000) }),
        delegationOp({ type: "UNDELEGATE", hash: "tx2", date: new Date(2000), hasFailed: true }),
        delegationOp({ type: "DELEGATE", hash: "tx3", date: new Date(3000) }),
      ];

      expect(refineDelegationTypes(ops).map(op => op.type)).toEqual([
        "DELEGATE",
        "UNDELEGATE",
        "REDELEGATE",
      ]);
    });

    it("orders delegations of a same block by nonce", () => {
      const sameDate = new Date(1000);
      const ops = [
        delegationOp({
          type: "DELEGATE",
          hash: "tx2",
          date: sameDate,
          transactionSequenceNumber: new BigNumber(8),
        }),
        delegationOp({
          type: "DELEGATE",
          hash: "tx1",
          date: sameDate,
          transactionSequenceNumber: new BigNumber(7),
        }),
      ];

      const byHash = new Map(refineDelegationTypes(ops).map(op => [op.hash, op.type]));

      expect(byHash.get("tx1")).toBe("DELEGATE");
      expect(byHash.get("tx2")).toBe("REDELEGATE");
    });

    it("returns the very same list when no operation needs a change", () => {
      const ops = [
        delegationOp({ type: "DELEGATE", hash: "tx1", date: new Date(1000) }),
        { type: "IN", id: "in-1" } as MinaOperation,
      ];

      expect(refineDelegationTypes(ops)).toBe(ops);
    });

    it("leaves the non-delegation operations untouched", () => {
      const payment = { type: "OUT", id: "out-1" } as MinaOperation;
      const ops = [
        payment,
        delegationOp({ type: "DELEGATE", hash: "tx1", date: new Date(1000) }),
        delegationOp({ type: "DELEGATE", hash: "tx2", date: new Date(2000) }),
      ];

      expect(refineDelegationTypes(ops)[0]).toBe(payment);
    });
  });

  describe("dropSupersededOperations", () => {
    it("drops a stored operation whose transaction came back under another id", () => {
      const stored = [storedOp("account_id-tx1-REDELEGATE", "tx1")];
      const fetched = [storedOp("account_id-tx1-DELEGATE", "tx1")];

      expect(dropSupersededOperations(stored, fetched)).toEqual([]);
    });

    it("keeps a stored operation the fetch confirms under the same id", () => {
      const stored = [storedOp("account_id-tx1-DELEGATE", "tx1")];
      const fetched = [storedOp("account_id-tx1-DELEGATE", "tx1")];

      expect(dropSupersededOperations(stored, fetched)).toEqual(stored);
    });

    it("keeps a stored operation the fetch does not report at all", () => {
      const stored = [storedOp("account_id-tx1-OUT", "tx1")];
      const fetched = [storedOp("account_id-tx2-OUT", "tx2")];

      expect(dropSupersededOperations(stored, fetched)).toEqual(stored);
    });

    it("keeps the other operations of a transaction that yields several", () => {
      const stored = [
        storedOp("account_id-tx1-OUT", "tx1"),
        storedOp("account_id-tx1-FEES", "tx1"),
      ];
      const fetched = [
        storedOp("account_id-tx1-OUT", "tx1"),
        storedOp("account_id-tx1-FEES", "tx1"),
      ];

      expect(dropSupersededOperations(stored, fetched)).toEqual(stored);
    });
  });
});
