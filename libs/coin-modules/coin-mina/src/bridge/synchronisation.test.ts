jest.mock("@ledgerhq/coin-framework/account/accountId");
jest.mock("@ledgerhq/coin-framework/bridge/jsHelpers");
jest.mock("@ledgerhq/coin-framework/operation");
jest.mock("../api");
jest.mock("../config");
jest.mock("../api/graphql");
jest.mock("../api/fetchValidators");

import { encodeAccountId } from "@ledgerhq/coin-framework/account/accountId";
import { mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import BigNumber from "bignumber.js";
import { getAccount, getTransactions, getBlockInfo, getDelegateAddress } from "../api";
import { fetchValidators } from "../api/fetchValidators";
import { getEpochInfo } from "../api/graphql";
import {
  createMockTxn,
  createMockAccountInfo,
  mockBlockInfo,
  mockAccountData,
} from "../test/fixtures";
import { getAccountShape, mapRosettaTxnToOperation } from "./synchronisation";

jest.mock("@ledgerhq/coin-framework/account/accountId");
jest.mock("@ledgerhq/coin-framework/bridge/jsHelpers");
jest.mock("@ledgerhq/coin-framework/operation");
jest.mock("../api");

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
            },
          },
        },
      } as any);
      jest.spyOn({ fetchValidators }, "fetchValidators").mockResolvedValue([]);
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
          },
        },
      });
    });
  });
});
