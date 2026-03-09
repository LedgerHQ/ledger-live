import { TransactionIntent } from "@ledgerhq/coin-framework/lib-es/api/types";
import BigNumber from "bignumber.js";
import coinConfig from "../config";
import { HARDCODED_BLOCK_HEIGHT, HEDERA_OPERATION_TYPES } from "../constants";
import * as logic from "../logic";
import * as logicUtils from "../logic/utils";
import { mapIntentToSDKOperation } from "../logic/utils";
import { apiClient } from "../network/api";
import * as networkUtils from "../network/utils";
import { getMockedConfig } from "../test/fixtures/config.fixture";
import { getMockedCurrency, getMockedHTSTokenCurrency } from "../test/fixtures/currency.fixture";
import { getMockedOperation } from "../test/fixtures/operation.fixture";
import { HederaMemo } from "../types";
import { createApi } from "./index";

jest.mock("../logic");
jest.mock("../logic/utils");
jest.mock("../network/utils");
jest.mock("../network/api");

const mockExtractFeesPayer = jest.mocked(logicUtils.extractFeesPayer);
const mockGetOperationValue = jest.mocked(logicUtils.getOperationValue);
const mockMapIntentToSDKOperation = jest.mocked(mapIntentToSDKOperation);
const mockToEVMAddress = jest.mocked(logicUtils.toEVMAddress);
const mockGetAccountTokens = jest.mocked(apiClient.getAccountTokens);
const mockGetERC20BalancesForAccountV2 = jest.mocked(networkUtils.getERC20BalancesForAccountV2);
const mockBroadcast = jest.mocked(logic.broadcast);
const mockCombine = jest.mocked(logic.combine);
const mockCraftTransaction = jest.mocked(logic.craftTransaction);
const mockEstimateFees = jest.mocked(logic.estimateFees);
const mockGetBalance = jest.mocked(logic.getBalance);
const mockLastBlockV2 = jest.mocked(logic.lastBlockV2);
const mockGetBlockV2 = jest.mocked(logic.getBlockV2);
const mockGetBlockInfo = jest.mocked(logic.getBlockInfo);
const mockGetValidators = jest.mocked(logic.getValidators);
const mockGetStakes = jest.mocked(logic.getStakes);
const mockGetRewards = jest.mocked(logic.getRewards);
const mockGetTokenFromAsset = jest.mocked(logic.getTokenFromAsset);
const mockGetAssetFromToken = jest.mocked(logic.getAssetFromToken);
const mockListOperationsV2 = jest.mocked(logic.listOperationsV2);

describe("createApi", () => {
  let api: ReturnType<typeof createApi>;
  const mockConfig = { ...getMockedConfig(), useHgraphForErc20: true };
  const mockCurrency = getMockedCurrency();

  beforeEach(() => {
    jest.clearAllMocks();
    api = createApi(mockConfig, mockCurrency.id);
  });

  it("should set the coin config value", () => {
    const mockSetCoinConfig = jest.spyOn(coinConfig, "setCoinConfig");

    createApi(mockConfig, mockCurrency.id);
    const config = coinConfig.getCoinConfig(mockCurrency);

    expect(mockSetCoinConfig).toHaveBeenCalled();
    expect(config).toMatchObject({
      status: { type: "active" },
    });
  });

  it("should return an API object with alpaca api methods", () => {
    expect(api.broadcast).toBeInstanceOf(Function);
    expect(api.combine).toBeInstanceOf(Function);
    expect(api.craftTransaction).toBeInstanceOf(Function);
    expect(api.estimateFees).toBeInstanceOf(Function);
    expect(api.getAssetFromToken).toBeInstanceOf(Function);
    expect(api.getBalance).toBeInstanceOf(Function);
    expect(api.getBlock).toBeInstanceOf(Function);
    expect(api.getBlockInfo).toBeInstanceOf(Function);
    expect(api.getTokenFromAsset).toBeInstanceOf(Function);
    expect(api.getValidators).toBeInstanceOf(Function);
    expect(api.getStakes).toBeInstanceOf(Function);
    expect(api.getRewards).toBeInstanceOf(Function);
    expect(api.lastBlock).toBeInstanceOf(Function);
    expect(api.listOperations).toBeInstanceOf(Function);
  });

  describe("broadcast", () => {
    it("should call broadcast from logic and return base64 hash", async () => {
      const fakeHash = new Uint8Array([1, 2, 3]);
      mockBroadcast.mockResolvedValue({ transactionHash: fakeHash });

      const result = await api.broadcast("tx");

      expect(mockBroadcast).toHaveBeenCalledTimes(1);
      expect(result).toBe(Buffer.from(fakeHash).toString("base64"));
    });
  });

  describe("combine", () => {
    it("should call combine from logic", () => {
      mockCombine.mockReturnValue("combined-tx");

      const result = api.combine("tx", "sig", "pubkey");

      expect(mockCombine).toHaveBeenCalledTimes(1);
      expect(result).toBe("combined-tx");
    });
  });

  describe("craftTransaction", () => {
    it("should call craftTransaction from logic and return serializedTx", async () => {
      mockCraftTransaction.mockResolvedValue({ serializedTx: "serialized" });
      const txIntent = { useAllAmount: false, recipient: "0.0.1234", amount: 100n };

      const result = await api.craftTransaction(txIntent);

      expect(mockCraftTransaction).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ transaction: "serialized" });
    });

    it("should throw when craftTransaction is called with useAllAmount", async () => {
      // @ts-expect-error - testing unsupported useAllAmount
      const txIntent: TransactionIntent<HederaMemo> = { useAllAmount: true };

      await expect(api.craftTransaction(txIntent)).rejects.toThrow("useAllAmount is not supported");
    });
  });

  describe("craftRawTransaction", () => {
    it("should throw when called", () => {
      expect(() => api.craftRawTransaction("tx", "sender", "pubkey", 1n)).toThrow(
        "craftRawTransaction is not supported",
      );
    });
  });

  describe("estimateFees", () => {
    it("should call estimateFees from logic and return FeeEstimation for non-ContractCall", async () => {
      mockMapIntentToSDKOperation.mockReturnValue("CRYPTOTRANSFER");
      mockEstimateFees.mockResolvedValue({ tinybars: new BigNumber(5000) });

      // @ts-expect-error - testing with minimal required fields for TransactionIntent
      const txIntent: TransactionIntent<HederaMemo> = { recipient: "0.0.1234", amount: 100n };

      const result = await api.estimateFees(txIntent);

      expect(result).toEqual({ value: BigInt("5000") });
      expect(mockEstimateFees).toHaveBeenCalledWith(
        expect.objectContaining({ operationType: "CRYPTOTRANSFER" }),
      );
    });

    it("should pass txIntent in estimateFeesParams for ContractCall operation type", async () => {
      mockMapIntentToSDKOperation.mockReturnValue(HEDERA_OPERATION_TYPES.ContractCall);
      mockEstimateFees.mockResolvedValue({ tinybars: new BigNumber(9000) });

      // @ts-expect-error - testing with minimal required fields for TransactionIntent
      const txIntent: TransactionIntent<HederaMemo> = { recipient: "0.0.1234", amount: 100n };

      const result = await api.estimateFees(txIntent);

      expect(result).toEqual({ value: BigInt("9000") });
      expect(mockEstimateFees).toHaveBeenCalledWith(
        expect.objectContaining({
          operationType: HEDERA_OPERATION_TYPES.ContractCall,
          txIntent,
        }),
      );
    });
  });

  describe("getBalance", () => {
    it("should call getBalance from logic", async () => {
      mockGetBalance.mockResolvedValue([{ value: 42n, asset: { type: "native" } }]);

      const result = await api.getBalance("0.0.1234");

      expect(mockGetBalance).toHaveBeenCalledTimes(1);
      expect(result).toEqual([{ value: 42n, asset: { type: "native" } }]);
    });
  });

  describe("lastBlock", () => {
    it("should call lastBlockV2 from logic", async () => {
      const mockBlock = { hash: "h", height: 1, time: new Date() };
      mockLastBlockV2.mockResolvedValue(mockBlock);

      const result = await api.lastBlock();

      expect(mockLastBlockV2).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockBlock);
    });
  });

  describe("getBlock", () => {
    it("should call getBlockV2 from logic", async () => {
      const mockBlock = { hash: "h", height: 1, time: new Date() };
      mockGetBlockV2.mockResolvedValue(mockBlock);

      const result = await api.getBlock(1);

      expect(mockGetBlockV2).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockBlock);
    });
  });

  describe("getBlockInfo", () => {
    it("should call getBlockInfo from logic", async () => {
      const mockBlockInfo = { hash: "h", height: 5, time: new Date() };
      mockGetBlockInfo.mockResolvedValue(mockBlockInfo);

      const result = await api.getBlockInfo(5);

      expect(mockGetBlockInfo).toHaveBeenCalledTimes(1);
      expect(mockGetBlockInfo).toHaveBeenCalledWith(5);
      expect(result).toEqual(mockBlockInfo);
    });
  });

  describe("getValidators", () => {
    it("should call getValidators from logic", async () => {
      const mockValidators = { items: [], next: undefined };
      mockGetValidators.mockResolvedValue(mockValidators);

      const result = await api.getValidators("cursor");

      expect(mockGetValidators).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockValidators);
    });
  });

  describe("getStakes", () => {
    it("should call getStakes from logic", async () => {
      const mockStakes = { items: [{ uid: "s1", amount: 100n }] };
      mockGetStakes.mockResolvedValue(mockStakes);

      const result = await api.getStakes("0.0.1234");

      expect(mockGetStakes).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockStakes);
    });
  });

  describe("getRewards", () => {
    it("should call getRewards from logic", async () => {
      const mockRewards = { items: [{ amount: 50n, receivedAt: new Date() }] };
      mockGetRewards.mockResolvedValue(mockRewards);

      const result = await api.getRewards("0.0.1234", "cursor");

      expect(mockGetRewards).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockRewards);
    });
  });

  describe("getTokenFromAsset", () => {
    it("should call getTokenFromAsset from logic", async () => {
      const mockToken = getMockedHTSTokenCurrency();
      const asset = { type: "token", assetReference: mockToken.id, assetOwner: "0.0.1234" };

      mockGetTokenFromAsset.mockResolvedValue(mockToken);

      const result = await api.getTokenFromAsset?.(asset);

      expect(mockGetTokenFromAsset).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockToken);
    });
  });

  describe("getAssetFromToken", () => {
    it("should call getAssetFromToken from logic", async () => {
      const token = getMockedHTSTokenCurrency();
      const mockAsset = { type: "token", assetReference: token.id, assetOwner: "0.0.1234" };

      mockGetAssetFromToken.mockResolvedValue(mockAsset);

      const result = await api.getAssetFromToken?.(token, mockAsset.assetOwner);

      expect(mockGetAssetFromToken).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockAsset);
    });
  });

  describe("listOperations", () => {
    const mockAddress = "0.0.1234";
    const mockFeesPayer = "0.0.111";
    const mockOptions = {
      limit: 10,
      order: "desc" as const,
      minHeight: 0,
      cursor: undefined,
    };
    const mockOperation = getMockedOperation({
      id: "op1",
      type: "IN",
      hash: "txhash",
      value: new BigNumber(100),
      fee: new BigNumber(10),
      extra: {
        transactionId: `${mockFeesPayer}-1234567890-1`,
      },
    });
    const mockTokenOperation = getMockedOperation({
      type: "OUT",
      contract: "0.0.555",
      standard: "erc20",
      value: new BigNumber(100),
    });
    const mockOperationOlder = getMockedOperation({
      id: "older",
      date: new Date("2024-01-01T00:00:01Z"),
      extra: { consensusTimestamp: "1000.0", transactionId: "0.0.111-1000.0" },
    });
    const mockOperationNewer = getMockedOperation({
      id: "newer",
      date: new Date("2024-01-01T00:00:02Z"),
      extra: { consensusTimestamp: "2000.0", transactionId: "0.0.111-2000.0" },
    });

    beforeEach(() => {
      mockExtractFeesPayer.mockReturnValue(mockFeesPayer);
      mockGetOperationValue.mockReturnValue(100n);
      mockToEVMAddress.mockResolvedValue("0xabc");
      mockGetAccountTokens.mockResolvedValue([]);
      mockGetERC20BalancesForAccountV2.mockResolvedValue([]);
    });

    it("should throw when minHeight is not 0", async () => {
      await expect(
        api.listOperations(mockAddress, { ...mockOptions, minHeight: 5 }),
      ).rejects.toThrow("minHeight is not supported");
    });

    it("should return mapped alpaca operations with correct shape", async () => {
      mockListOperationsV2.mockResolvedValue({
        coinOperations: [mockOperation],
        tokenOperations: [],
        nextCursor: "next123",
      });

      const result = await api.listOperations(mockAddress, mockOptions);

      expect(mockListOperationsV2).toHaveBeenCalledTimes(1);
      expect(result.next).toBe("next123");
      expect(result.items).toEqual([
        expect.objectContaining({
          id: "op1",
          type: "IN",
          asset: { type: "native" },
          value: BigInt(mockOperation.value.toString()),
          tx: expect.objectContaining({
            hash: mockOperation.hash,
            fees: BigInt(mockOperation.fee.toString()),
            feesPayer: mockFeesPayer,
            failed: false,
          }),
        }),
      ]);
    });

    it("should map token operation contract to token asset and include assetAmount in details", async () => {
      mockListOperationsV2.mockResolvedValue({
        coinOperations: [],
        tokenOperations: [mockTokenOperation],
        nextCursor: null,
      });

      const result = await api.listOperations(mockAddress, mockOptions);

      expect(result.items[0].details).toMatchObject({
        assetAmount: mockTokenOperation.value.toFixed(0),
      });
      expect(result.items[0].asset).toEqual({
        type: mockTokenOperation.standard,
        assetReference: mockTokenOperation.contract,
        assetOwner: mockAddress,
      });
    });

    it("should include stakedAmount in details when present in extra", async () => {
      mockListOperationsV2.mockResolvedValue({
        coinOperations: [
          getMockedOperation({
            extra: { stakedAmount: new BigNumber(200) },
          }),
        ],
        tokenOperations: [],
        nextCursor: null,
      });

      const result = await api.listOperations(mockAddress, mockOptions);

      expect(result.items[0].details).toMatchObject({ stakedAmount: 200n });
    });

    it("should omit feesPayer when transactionId is absent", async () => {
      const mockOperationWithoutTransactionId = getMockedOperation({
        extra: {},
      });

      mockListOperationsV2.mockResolvedValue({
        coinOperations: [mockOperationWithoutTransactionId],
        tokenOperations: [],
        nextCursor: null,
      });

      const result = await api.listOperations(mockAddress, mockOptions);

      expect(mockExtractFeesPayer).not.toHaveBeenCalled();
      expect(result.items[0].tx).not.toHaveProperty("feesPayer");
    });

    it.each([
      ["desc", [mockOperationOlder], [mockOperationNewer]],
      ["asc", [mockOperationNewer], [mockOperationOlder]],
    ] as const)("should sort by consensusTimestamp %s", async (order, coinOps, tokenOps) => {
      mockListOperationsV2.mockResolvedValue({
        coinOperations: coinOps,
        tokenOperations: tokenOps,
        nextCursor: null,
      });

      const result = await api.listOperations(mockAddress, { ...mockOptions, order });

      const newId = mockOperationNewer.id;
      const oldId = mockOperationOlder.id;

      expect(result.items[0].id).toEqual(order === "desc" ? newId : oldId);
      expect(result.items[1].id).toEqual(order === "desc" ? oldId : newId);
    });

    it("should fall back to date sort when consensusTimestamp is missing", async () => {
      mockListOperationsV2.mockResolvedValue({
        coinOperations: [{ ...mockOperationOlder, extra: {} }],
        tokenOperations: [{ ...mockOperationNewer, extra: {} }],
        nextCursor: null,
      });

      const result = await api.listOperations(mockAddress, { ...mockOptions, order: "desc" });

      expect(result.items[0].id).toBe(mockOperationNewer.id);
      expect(result.items[1].id).toBe(mockOperationOlder.id);
    });

    it("should return undefined next when nextCursor is null", async () => {
      mockListOperationsV2.mockResolvedValue({
        coinOperations: [],
        tokenOperations: [],
        nextCursor: null,
      });

      const result = await api.listOperations(mockAddress, mockOptions);

      expect(result.next).toBeUndefined();
    });

    it("should use HARDCODED_BLOCK_HEIGHT and getBlockHash when blockHeight is missing", async () => {
      mockListOperationsV2.mockResolvedValue({
        coinOperations: [mockOperation],
        tokenOperations: [],
        nextCursor: null,
      });

      const result = await api.listOperations(mockAddress, mockOptions);

      expect(mockListOperationsV2).toHaveBeenCalledTimes(1);
      expect(logicUtils.getBlockHash).toHaveBeenCalledTimes(1);
      expect(result.items[0].tx.block.height).toEqual(HARDCODED_BLOCK_HEIGHT);
    });

    it("should throw when evm address is missing", async () => {
      mockToEVMAddress.mockResolvedValue(null);

      await expect(api.listOperations(mockAddress, mockOptions)).rejects.toThrow(
        "hedera: evm address is missing",
      );
    });
  });

  describe("validateIntent", () => {
    it("should throw when called", async () => {
      // @ts-expect-error - testing unsupported method
      await expect(api.validateIntent({}, [], undefined)).rejects.toThrow(
        "validateIntent is not supported",
      );
    });
  });

  describe("getSequence", () => {
    it("should throw when called", async () => {
      await expect(api.getSequence("0.0.1234")).rejects.toThrow("getSequence is not supported");
    });
  });
});
