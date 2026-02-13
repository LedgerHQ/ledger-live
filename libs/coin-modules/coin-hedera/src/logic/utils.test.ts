import BigNumber from "bignumber.js";
import { createHash } from "crypto";
import { Transaction as SDKTransaction, TransactionId } from "@hashgraph/sdk";
import type { AssetInfo, TransactionIntent } from "@ledgerhq/coin-framework/api/types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { InvalidAddress } from "@ledgerhq/errors";
import { getEnv, setEnv } from "@ledgerhq/live-env";
import {
  HEDERA_OPERATION_TYPES,
  HEDERA_TRANSACTION_MODES,
  SYNTHETIC_BLOCK_WINDOW_SECONDS,
  OP_TYPES_EXCLUDING_FEES,
} from "../constants";
import { HederaRecipientInvalidChecksum } from "../errors";
import { apiClient } from "../network/api";
import { rpcClient } from "../network/rpc";

// Mock preloadData module before importing
jest.mock("../preload-data", () => ({
  ...jest.requireActual("../preload-data"),
  getCurrentHederaPreloadData: jest.fn(),
}));

import * as preloadData from "../preload-data";

const mockGetCurrentHederaPreloadData = preloadData.getCurrentHederaPreloadData as jest.Mock;
import { getMockedOperation } from "../test/fixtures/operation.fixture";
import {
  getMockedERC20TokenCurrency,
  getMockedHTSTokenCurrency,
} from "../test/fixtures/currency.fixture";
import { getMockedAccount, getMockedTokenAccount } from "../test/fixtures/account.fixture";
import { getMockedMirrorAccount } from "../test/fixtures/mirror.fixture";
import type {
  HederaAccount,
  HederaMemo,
  HederaMirrorTransaction,
  HederaPreloadData,
  HederaTxData,
  HederaValidator,
  Transaction,
} from "../types";
import {
  serializeSignature,
  deserializeSignature,
  serializeTransaction,
  deserializeTransaction,
  extractFeesPayer,
  getOperationValue,
  getMemoFromBase64,
  sendRecipientCanNext,
  isValidExtra,
  isTokenAssociationRequired,
  isAutoTokenAssociationEnabled,
  isTokenAssociateTransaction,
  getTransactionExplorer,
  checkAccountTokenAssociationStatus,
  safeParseAccountId,
  getSyntheticBlock,
  fromEVMAddress,
  toEVMAddress,
  formatTransactionId,
  getDateRangeFromBlockHeight,
  getBlockHash,
  isStakingTransaction,
  extractCompanyFromNodeDescription,
  sortValidators,
  getValidatorFromAccount,
  getDefaultValidator,
  getDelegationStatus,
  filterValidatorBySearchTerm,
  hasSpecificIntentData,
  getChecksum,
  mapIntentToSDKOperation,
  getOperationDetailsExtraFields,
  calculateAPY,
  analyzeStakingOperation,
  calculateUncommittedBalanceChange,
} from "./utils";

jest.mock("../network/api");

describe("logic utils", () => {
  let oldStakingLedgerNodeIdEnv: number;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    setEnv("HEDERA_STAKING_LEDGER_NODE_ID", oldStakingLedgerNodeIdEnv);
  });

  beforeAll(() => {
    oldStakingLedgerNodeIdEnv = getEnv("HEDERA_STAKING_LEDGER_NODE_ID");
  });

  afterAll(async () => {
    await rpcClient._resetInstance();
  });

  describe("signature serialization", () => {
    it("should serialize a signature to base64", () => {
      const signature = new Uint8Array([1, 2, 3, 4, 5]);
      const serialized = serializeSignature(signature);

      expect(serialized).toBe("AQIDBAU=");
    });

    it("should deserialize a base64 signature to Uint8Array", () => {
      const base64Signature = "AQIDBAU=";
      const deserialized = deserializeSignature(base64Signature);

      expect(deserialized).toEqual(Buffer.from([1, 2, 3, 4, 5]));
    });
  });

  describe("transaction serialization", () => {
    beforeEach(() => {
      jest.spyOn(SDKTransaction, "fromBytes");
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should serialize a transaction to hex", () => {
      const mockTransaction = {
        toBytes: jest.fn().mockReturnValue(Buffer.from([10, 20, 30, 40, 50])),
      } as unknown as SDKTransaction;

      const serialized = serializeTransaction(mockTransaction);

      expect(serialized).toBe("0a141e2832");
      expect(mockTransaction.toBytes).toHaveBeenCalled();
    });

    it("should deserialize a hex string to a Transaction", () => {
      const mockTransaction = { id: "mock-transaction-id" };
      (SDKTransaction.fromBytes as jest.Mock).mockReturnValue(mockTransaction);

      const hexTransaction = "0a141e2832";
      const deserialized = deserializeTransaction(hexTransaction);

      const hexTransactionBuffer = Buffer.from([10, 20, 30, 40, 50]);
      expect(SDKTransaction.fromBytes).toHaveBeenCalledTimes(1);
      expect(SDKTransaction.fromBytes).toHaveBeenCalledWith(hexTransactionBuffer);
      expect(deserialized).toBe(mockTransaction);
    });
  });

  describe("getOperationValue", () => {
    const nativeAsset: AssetInfo = { type: "native" };
    const tokenAsset: AssetInfo = { type: "hts", assetReference: "0.0.1234" };

    it("should return 0 for FEES operations", () => {
      const operation = getMockedOperation({
        type: "FEES",
        value: BigNumber(0),
        fee: BigNumber(100),
      });

      expect(getOperationValue({ asset: nativeAsset, operation })).toBe(BigInt(0));
      expect(getOperationValue({ asset: tokenAsset, operation })).toBe(BigInt(0));
    });

    it("should subtract fee from native operations that exclude fees", () => {
      OP_TYPES_EXCLUDING_FEES.forEach(type => {
        const operation = getMockedOperation({
          type,
          value: BigNumber(1000),
          fee: BigNumber(100),
        });

        expect(getOperationValue({ asset: nativeAsset, operation })).toBe(BigInt(900));
      });
    });

    it("should return value for other operations", () => {
      const operationOut = getMockedOperation({
        type: "OUT",
        value: BigNumber(500),
        fee: BigNumber(20),
      });

      const operationIn = getMockedOperation({
        type: "IN",
        value: BigNumber(800),
        fee: BigNumber(30),
      });

      expect(getOperationValue({ asset: tokenAsset, operation: operationOut })).toBe(BigInt(500));
      expect(getOperationValue({ asset: tokenAsset, operation: operationIn })).toBe(BigInt(800));
      expect(getOperationValue({ asset: nativeAsset, operation: operationIn })).toBe(BigInt(800));
    });
  });

  describe("mapIntentToSDKOperation", () => {
    it("should return TokenAssociate for TokenAssociate intent", () => {
      const txIntent = {
        type: HEDERA_TRANSACTION_MODES.TokenAssociate,
      } as TransactionIntent;

      expect(mapIntentToSDKOperation(txIntent)).toBe(HEDERA_OPERATION_TYPES.TokenAssociate);
    });

    it("should return TokenTransfer for Send intent with HTS asset", () => {
      const txIntent = {
        type: HEDERA_TRANSACTION_MODES.Send,
        asset: { type: "hts", assetReference: "0.0.1234" },
      } as TransactionIntent;

      expect(mapIntentToSDKOperation(txIntent)).toBe(HEDERA_OPERATION_TYPES.TokenTransfer);
    });

    it("should return ContractCall for Send intent with ERC20 asset", () => {
      const txIntent = {
        type: HEDERA_TRANSACTION_MODES.Send,
        asset: { type: "erc20", assetReference: "0x1234" },
      } as TransactionIntent;

      expect(mapIntentToSDKOperation(txIntent)).toBe(HEDERA_OPERATION_TYPES.ContractCall);
    });

    it("should return CryptoUpdate for Delegate intent", () => {
      const txIntent = {
        type: HEDERA_TRANSACTION_MODES.Delegate,
      } as TransactionIntent;

      expect(mapIntentToSDKOperation(txIntent)).toBe(HEDERA_OPERATION_TYPES.CryptoUpdate);
    });

    it("should return CryptoUpdate for Undelegate intent", () => {
      const txIntent = {
        type: HEDERA_TRANSACTION_MODES.Undelegate,
      } as TransactionIntent;

      expect(mapIntentToSDKOperation(txIntent)).toBe(HEDERA_OPERATION_TYPES.CryptoUpdate);
    });

    it("should return CryptoUpdate for Redelegate intent", () => {
      const txIntent = {
        type: HEDERA_TRANSACTION_MODES.Redelegate,
      } as TransactionIntent;

      expect(mapIntentToSDKOperation(txIntent)).toBe(HEDERA_OPERATION_TYPES.CryptoUpdate);
    });

    it("should return CryptoTransfer for Send intent with native asset", () => {
      const txIntent = {
        type: HEDERA_TRANSACTION_MODES.Send,
        asset: { type: "native" },
      } as TransactionIntent;

      expect(mapIntentToSDKOperation(txIntent)).toBe(HEDERA_OPERATION_TYPES.CryptoTransfer);
    });

    it("should return CryptoTransfer for other intent types", () => {
      const txIntent = {
        type: HEDERA_TRANSACTION_MODES.ClaimRewards,
      } as TransactionIntent;

      expect(mapIntentToSDKOperation(txIntent)).toBe(HEDERA_OPERATION_TYPES.CryptoTransfer);
    });
  });

  describe("getMemoFromBase64", () => {
    it("decodes a simple base64 string", () => {
      expect(getMemoFromBase64("YnJkZw==")).toBe("brdg");
    });

    it("decodes an empty string", () => {
      expect(getMemoFromBase64("")).toBe("");
    });

    it("decodes a base64 string with spaces", () => {
      const input = Buffer.from("hello world", "utf-8").toString("base64");
      expect(getMemoFromBase64(input)).toBe("hello world");
    });

    it("decodes special characters", () => {
      const input = Buffer.from("😀✨", "utf-8").toString("base64");
      expect(getMemoFromBase64(input)).toBe("😀✨");
    });

    it("returns null for bad input", () => {
      expect(getMemoFromBase64(undefined)).toBeNull();
      expect(getMemoFromBase64(null as unknown as string)).toBeNull();
      expect(getMemoFromBase64({} as unknown as string)).toBeNull();
      expect(getMemoFromBase64(10 as unknown as string)).toBeNull();
    });
  });

  describe("extractFeesPayer", () => {
    it("returns Hedera account ID from valid transaction_id", () => {
      expect(extractFeesPayer("0.0.12345-1625097600-000")).toBe("0.0.12345");
    });

    it("returns undefined for undefined input", () => {
      expect(extractFeesPayer(undefined)).toBeUndefined();
    });

    it("returns undefined for empty string input", () => {
      expect(extractFeesPayer("")).toBeUndefined();
    });
    // other kind of check are unnecessary, we trust the mirror node data
  });

  describe("getTransactionExplorer", () => {
    it("Tx explorer URL is converted from hash to consensus timestamp", async () => {
      const explorerView = getCryptoCurrencyById("hedera").explorerViews[0];
      expect(explorerView).toEqual({
        tx: expect.any(String),
        address: expect.any(String),
      });

      const mockedOperation = getMockedOperation({
        extra: { consensusTimestamp: "1.2.3.4" },
      });

      const newUrl = getTransactionExplorer(explorerView, mockedOperation);
      expect(newUrl).toBe("https://hashscan.io/mainnet/transaction/1.2.3.4");
    });

    it("Tx explorer URL is based on transaction id if consensus timestamp is not available", async () => {
      const explorerView = getCryptoCurrencyById("hedera").explorerViews[0];
      expect(explorerView).toEqual({
        tx: expect.any(String),
        address: expect.any(String),
      });

      const mockedOperation = getMockedOperation({
        extra: { transactionId: "0.0.1234567-123-123" },
      });

      const newUrl = getTransactionExplorer(explorerView, mockedOperation);
      expect(newUrl).toBe("https://hashscan.io/mainnet/transaction/0.0.1234567-123-123");
    });
  });

  describe("isTokenAssociateTransaction", () => {
    it("returns correct value based on tx.properties", () => {
      expect(
        isTokenAssociateTransaction({ mode: HEDERA_TRANSACTION_MODES.TokenAssociate } as any),
      ).toBe(true);
      expect(isTokenAssociateTransaction({ mode: HEDERA_TRANSACTION_MODES.Send } as any)).toBe(
        false,
      );
      expect(isTokenAssociateTransaction({} as any)).toBe(false);
    });
  });

  describe("isAutoTokenAssociationEnabled", () => {
    it("returns value based on isAutoTokenAssociationEnabled flag", () => {
      expect(
        isAutoTokenAssociationEnabled({
          hederaResources: { isAutoTokenAssociationEnabled: true },
        } as any),
      ).toBe(true);

      expect(
        isAutoTokenAssociationEnabled({
          hederaResources: { isAutoTokenAssociationEnabled: false },
        } as any),
      ).toBe(false);

      expect(isAutoTokenAssociationEnabled({} as any)).toBe(false);
    });
  });

  describe("isTokenAssociationRequired", () => {
    it("should return false if token is already associated (token account exists)", () => {
      const mockedTokenCurrency = getMockedHTSTokenCurrency();
      const mockedTokenAccount = getMockedTokenAccount(mockedTokenCurrency);
      const mockedAccount = getMockedAccount({ subAccounts: [mockedTokenAccount] });

      expect(isTokenAssociationRequired(mockedAccount, mockedTokenCurrency)).toBe(false);
    });

    it("should return false if auto token associations are enabled", () => {
      const mockedTokenCurrency = getMockedHTSTokenCurrency();
      const mockedAccount = getMockedAccount({
        subAccounts: [],
        hederaResources: {
          maxAutomaticTokenAssociations: -1,
          isAutoTokenAssociationEnabled: true,
          delegation: null,
        },
      });

      expect(isTokenAssociationRequired(mockedAccount, mockedTokenCurrency)).toBe(false);
    });

    it("should return true if token is not associated and auto associations are disabled", () => {
      const mockedTokenCurrency = getMockedHTSTokenCurrency();
      const mockedAccount = getMockedAccount({ subAccounts: [] });

      expect(isTokenAssociationRequired(mockedAccount, mockedTokenCurrency)).toBe(true);
    });

    it("should return false for erc20 token", () => {
      const mockedTokenCurrency = getMockedERC20TokenCurrency();
      const mockedAccount = getMockedAccount({ subAccounts: [] });

      expect(isTokenAssociationRequired(mockedAccount, mockedTokenCurrency)).toBe(false);
    });

    it("should return false if token is undefined", () => {
      const mockedAccount = getMockedAccount({ subAccounts: [] });

      expect(isTokenAssociationRequired(mockedAccount, undefined)).toBe(false);
    });

    it("should return false for legacy accounts without subAccounts or hederaResources", () => {
      const mockedTokenCurrency = getMockedHTSTokenCurrency();
      const mockedAccount = getMockedAccount();

      delete mockedAccount.subAccounts;
      delete mockedAccount.hederaResources;

      expect(isTokenAssociationRequired(mockedAccount, mockedTokenCurrency)).toBe(true);
    });
  });

  describe("isValidExtra", () => {
    it("returns true for object and false for invalid types", () => {
      expect(isValidExtra({ some: "value" })).toBe(true);
      expect(isValidExtra(null)).toBe(false);
      expect(isValidExtra(undefined)).toBe(false);
      expect(isValidExtra("string")).toBe(false);
      expect(isValidExtra(123)).toBe(false);
      expect(isValidExtra([])).toBe(false);
    });
  });

  describe("sendRecipientCanNext", () => {
    it("handles association warnings", () => {
      expect(sendRecipientCanNext({ warnings: {} } as any)).toBe(true);
      expect(sendRecipientCanNext({ warnings: { missingAssociation: new Error() } } as any)).toBe(
        false,
      );
      expect(
        sendRecipientCanNext({ warnings: { unverifiedAssociation: new Error() } } as any),
      ).toBe(false);
    });
  });

  describe("checkAccountTokenAssociationStatus", () => {
    const accountId = "0.0.1234";
    const htsToken = getMockedHTSTokenCurrency({ contractAddress: "0.0.1234", tokenType: "hts" });
    const erc20Token = getMockedHTSTokenCurrency({
      contractAddress: "0.0.4321",
      tokenType: "erc20",
    });

    beforeEach(() => {
      jest.clearAllMocks();
      // reset LRU cache to make sure all tests receive correct mocks from mockedGetAccount
      checkAccountTokenAssociationStatus.clear(`${accountId}-${htsToken.contractAddress}`);
    });

    it("returns true if max_automatic_token_associations === -1", async () => {
      (apiClient.getAccount as jest.Mock).mockResolvedValueOnce({
        account: accountId,
        max_automatic_token_associations: -1,
        balance: {
          balance: 0,
          timestamp: "",
          tokens: [],
        },
      });

      const result = await checkAccountTokenAssociationStatus(accountId, htsToken);
      expect(result).toBe(true);
    });

    it("returns true if token is already associated", async () => {
      (apiClient.getAccount as jest.Mock).mockResolvedValueOnce({
        account: accountId,
        max_automatic_token_associations: 0,
        balance: {
          balance: 1,
          timestamp: "",
          tokens: [{ token_id: htsToken.contractAddress, balance: 1 }],
        },
      });

      const result = await checkAccountTokenAssociationStatus(accountId, htsToken);
      expect(result).toBe(true);
    });

    it("returns false if token is not associated", async () => {
      (apiClient.getAccount as jest.Mock).mockResolvedValueOnce({
        account: accountId,
        max_automatic_token_associations: 0,
        balance: {
          balance: 1,
          timestamp: "",
          tokens: [{ token_id: "0.1234", balance: 1 }],
        },
      });

      const result = await checkAccountTokenAssociationStatus(accountId, htsToken);
      expect(result).toBe(false);
    });

    it("returns true for erc20 tokens", async () => {
      const result = await checkAccountTokenAssociationStatus(accountId, erc20Token);
      expect(apiClient.getAccount as jest.Mock).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it("supports addresses with checksum", async () => {
      const addressWithChecksum = "0.0.9124531-xrxlv";

      (apiClient.getAccount as jest.Mock).mockResolvedValueOnce({
        account: accountId,
        max_automatic_token_associations: 0,
        balance: {
          balance: 1,
          timestamp: "",
          tokens: [{ token_id: htsToken.contractAddress, balance: 1 }],
        },
      });

      await checkAccountTokenAssociationStatus(addressWithChecksum, htsToken);
      expect(apiClient.getAccount).toHaveBeenCalledTimes(1);
      expect(apiClient.getAccount).toHaveBeenCalledWith("0.0.9124531");
    });
  });

  describe("getChecksum", () => {
    it("should return correct checksum for valid account ID", () => {
      const accountId = "0.0.9124531-xrxlv";
      const checksum = getChecksum(accountId);

      expect(checksum).toBe("xrxlv");
    });

    it("should return null for invalid account ID", () => {
      const accountId = "invalid-account-id";
      const checksum = getChecksum(accountId);

      expect(checksum).toBeNull();
    });
  });

  describe("safeParseAccountId", () => {
    it("returns account id and no checksum for valid address without checksum", async () => {
      const [error, result] = await safeParseAccountId("0.0.9124531");

      expect(error).toBeNull();
      expect(result?.accountId).toBe("0.0.9124531");
      expect(result?.checksum).toBeNull();
    });

    it("returns account id and checksum for valid address with correct checksum", async () => {
      const [error, result] = await safeParseAccountId("0.0.9124531-xrxlv");

      expect(error).toBeNull();
      expect(result?.accountId).toBe("0.0.9124531");
      expect(result?.checksum).toBe("xrxlv");
    });

    it("returns error for valid address with incorrect checksum", async () => {
      const [error, accountId] = await safeParseAccountId("0.0.9124531-invld");

      expect(error).toBeInstanceOf(HederaRecipientInvalidChecksum);
      expect(accountId).toBeNull();
    });

    it("returns error for invalid address format", async () => {
      const [error, accountId] = await safeParseAccountId("not-a-valid-address");

      expect(error).toBeInstanceOf(InvalidAddress);
      expect(accountId).toBeNull();
    });
  });

  describe("getSyntheticBlock", () => {
    it("calculates correct blockHeight and blockHash for typical timestamp, with default block window", () => {
      const consensusTimestamp = "1760523159.854347000";
      const blockWindowSeconds = SYNTHETIC_BLOCK_WINDOW_SECONDS;
      const expectedSeconds = Math.floor(Number(consensusTimestamp));
      const expectedBlockHeight = Math.floor(expectedSeconds / blockWindowSeconds);
      const expectedBlockHash = createHash("sha256")
        .update(expectedBlockHeight.toString())
        .digest("hex");

      const result = getSyntheticBlock(consensusTimestamp);

      expect(result.blockHeight).toBe(expectedBlockHeight);
      expect(result.blockHash).toBe(expectedBlockHash);
    });

    it("supports custom blockWindowSeconds", () => {
      const consensusTimestamp = "1760523159.854347000";
      const blockWindowSeconds = 3600;
      const expectedSeconds = Math.floor(Number(consensusTimestamp));
      const expectedBlockHeight = Math.floor(expectedSeconds / blockWindowSeconds);
      const expectedBlockHash = createHash("sha256")
        .update(expectedBlockHeight.toString())
        .digest("hex");

      const result = getSyntheticBlock(consensusTimestamp, blockWindowSeconds);

      expect(result.blockHeight).toBe(expectedBlockHeight);
      expect(result.blockHash).toBe(expectedBlockHash);
    });

    it("throws error for invalid consensusTimestamp", () => {
      expect(() => getSyntheticBlock("not_a_number")).toThrow();
      expect(() => getSyntheticBlock("")).toThrow();
    });
  });

  describe("formatTransactionId", () => {
    it("converts SDK TransactionId format to mirror node format", () => {
      const mockTransactionId = {
        toString: () => "0.0.8835924@1759825731.231952875",
      } as TransactionId;

      const result = formatTransactionId(mockTransactionId);
      expect(result).toBe("0.0.8835924-1759825731-231952875");
    });

    it("handles different account ID formats", () => {
      const mockTransactionId = {
        toString: () => "0.0.1@1234567890.987654321",
      } as TransactionId;

      const result = formatTransactionId(mockTransactionId);
      expect(result).toBe("0.0.1-1234567890-987654321");
    });
  });

  describe("toEVMAddress", () => {
    const mockMirrorAccount = {
      account: "0.0.12345",
      evm_address: "0x0000000000000000000000000000000000003039",
    };

    it("returns correct EVM address for valid Hedera account ID", async () => {
      (apiClient.getAccount as jest.Mock).mockResolvedValueOnce(mockMirrorAccount);

      const evmAddress = await toEVMAddress(mockMirrorAccount.account);

      expect(apiClient.getAccount).toHaveBeenCalledTimes(1);
      expect(apiClient.getAccount).toHaveBeenCalledWith(mockMirrorAccount.account);
      expect(evmAddress).toBe(mockMirrorAccount.evm_address);
    });

    it("returns null when API call fails", async () => {
      (apiClient.getAccount as jest.Mock).mockRejectedValueOnce(new Error("API error"));

      const evmAddress = await toEVMAddress(mockMirrorAccount.account);

      expect(apiClient.getAccount).toHaveBeenCalledTimes(1);
      expect(evmAddress).toBeNull();
    });
  });

  describe("fromEVMAddress", () => {
    it("should convert a long-zero EVM address to Hedera account ID", () => {
      const evmAddress = "0x00000000000000000000000000000000008b3ab3";
      const result = fromEVMAddress(evmAddress);
      expect(result).toBe("0.0.9124531");
    });

    it("should return null for non-long-zero EVM address", () => {
      const evmAddress = "0xae2e616828973ec543bbce40cf640c012c5a3805";
      const result = fromEVMAddress(evmAddress, 0, 0);
      expect(result).toBeNull();
    });

    it("should handle custom shard and realm values", () => {
      const evmAddress = "0x0000000000000000000000000000000000000064";
      const result = fromEVMAddress(evmAddress, 1, 2);
      expect(result).toBe("1.2.100");
    });

    it("should return null for invalid EVM addresses", () => {
      expect(fromEVMAddress("not-an-address")).toBeNull();
      expect(fromEVMAddress("0xInvalid")).toBeNull();
      expect(fromEVMAddress("")).toBeNull();
      expect(fromEVMAddress("1234567890")).toBeNull();
      expect(fromEVMAddress(undefined as unknown as string)).toBeNull();
    });
  });

  describe("getBlockHash", () => {
    it("produces consistent 64-character hex hash", () => {
      const hash = getBlockHash(12345);

      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it("produces same hash for same block height", () => {
      const hash1 = getBlockHash(100);
      const hash2 = getBlockHash(100);

      expect(hash1).toBe(hash2);
    });

    it("produces different hashes for different block heights", () => {
      const hash1 = getBlockHash(100);
      const hash2 = getBlockHash(101);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe("getDateRangeFromBlockHeight", () => {
    it("calculates consensus timestamp for block height 0 with default window", () => {
      const result = getDateRangeFromBlockHeight(0);

      expect(result).toEqual({
        start: new Date(0),
        end: new Date(10000),
      });
    });

    it("calculates consensus timestamp for block height 1 with default window", () => {
      const result = getDateRangeFromBlockHeight(1);

      expect(result).toEqual({
        start: new Date(10000),
        end: new Date(20000),
      });
    });

    it("calculates consensus timestamp with custom block window of 1 second", () => {
      const result = getDateRangeFromBlockHeight(42, 1);

      expect(result).toEqual({
        start: new Date(42000),
        end: new Date(43000),
      });
    });

    it("handles large block heights correctly", () => {
      const result = getDateRangeFromBlockHeight(1000000);

      expect(result).toEqual({
        start: new Date("1970-04-26T17:46:40.000Z"),
        end: new Date("1970-04-26T17:46:50.000Z"),
      });
    });

    it("ensures start and end timestamps are within the same block window", () => {
      const blockHeight = 50;
      const blockWindowSeconds = 10;
      const result = getDateRangeFromBlockHeight(blockHeight, blockWindowSeconds);

      const startSeconds = result.start.getTime() / 1000;
      const endSeconds = result.end.getTime() / 1000;

      expect(endSeconds - startSeconds).toBe(blockWindowSeconds);
    });

    it("does not use sub second precision", () => {
      const result = getDateRangeFromBlockHeight(123);

      expect(result.start.getMilliseconds()).toEqual(0);
      expect(result.end.getMilliseconds()).toEqual(0);
    });
  });

  describe("isStakingTransaction", () => {
    it("returns correct value based on tx.mode", () => {
      const stakingDelegateTx = { mode: HEDERA_TRANSACTION_MODES.Delegate } as Transaction;
      const stakingUndelegateTx = { mode: HEDERA_TRANSACTION_MODES.Undelegate } as Transaction;
      const stakingRedelegateTx = { mode: HEDERA_TRANSACTION_MODES.Redelegate } as Transaction;
      const stakingClaimRewardsTx = { mode: HEDERA_TRANSACTION_MODES.ClaimRewards } as Transaction;
      const transferTx = { recipient: "", amount: new BigNumber(1) } as Transaction;
      const emptyTx = {} as Transaction;

      expect(isStakingTransaction(stakingDelegateTx)).toBe(true);
      expect(isStakingTransaction(stakingUndelegateTx)).toBe(true);
      expect(isStakingTransaction(stakingRedelegateTx)).toBe(true);
      expect(isStakingTransaction(stakingClaimRewardsTx)).toBe(true);
      expect(isStakingTransaction(transferTx)).toBe(false);
      expect(isStakingTransaction(emptyTx)).toBe(false);
    });

    it("returns false for undefined or null transactions", () => {
      expect(isStakingTransaction(undefined as unknown as Transaction)).toBe(false);
      expect(isStakingTransaction(null as unknown as Transaction)).toBe(false);
    });
  });

  describe("extractCompanyFromNodeDescription", () => {
    it("extracts company name from description", () => {
      expect(extractCompanyFromNodeDescription("Hosted by Ledger | Paris, France")).toBe("Ledger");
      expect(extractCompanyFromNodeDescription("Hosted by LG | Seoul, South Korea")).toBe("LG");
      expect(extractCompanyFromNodeDescription("TestCompany | something else")).toBe("TestCompany");
      expect(extractCompanyFromNodeDescription("NoSeparator ")).toBe("NoSeparator");
    });
  });

  describe("sortValidators", () => {
    it("sorts validators by active stake DESC, Ledger node first if set", () => {
      setEnv("HEDERA_STAKING_LEDGER_NODE_ID", 2);

      const validators = [
        { nodeId: 3, activeStake: new BigNumber(1000) },
        { nodeId: 2, activeStake: new BigNumber(2000) },
        { nodeId: 1, activeStake: new BigNumber(3000) },
      ] as HederaValidator[];

      const sorted = sortValidators(validators);

      expect(sorted[0].nodeId).toBe(2);
      expect(sorted[1].nodeId).toBe(1);
      expect(sorted[2].nodeId).toBe(3);
    });
  });

  describe("getValidatorFromAccount", () => {
    const mockValidator = { nodeId: 1 };
    const mockPreload = { validators: [mockValidator] } as HederaPreloadData;

    beforeEach(() => {
      jest.clearAllMocks();

      mockGetCurrentHederaPreloadData.mockReturnValue(mockPreload);
    });

    it("returns validator matching delegation nodeId", () => {
      const mockAccount = {
        currency: "hedera",
        hederaResources: { delegation: { nodeId: 1 } },
      } as unknown as HederaAccount;

      expect(getValidatorFromAccount(mockAccount)).toEqual(mockValidator);
    });

    it("returns null if no delegation", () => {
      const mockAccount = {
        currency: "hedera",
        hederaResources: {},
      } as unknown as HederaAccount;

      expect(getValidatorFromAccount(mockAccount)).toBeNull();
    });
  });

  describe("getDefaultValidator", () => {
    const mockValidators = [
      { nodeId: 1, activeStake: new BigNumber(2000) },
      { nodeId: 2, activeStake: new BigNumber(1000) },
      { nodeId: 3, activeStake: new BigNumber(10000) },
    ] as HederaValidator[];

    it("returns Ledger validator if present", () => {
      setEnv("HEDERA_STAKING_LEDGER_NODE_ID", 2);
      expect(getDefaultValidator(mockValidators)?.nodeId).toBe(2);
    });

    it("returns null if no Ledger validator is present", () => {
      expect(getDefaultValidator([])).toBeNull();
    });
  });

  describe("getDelegationStatus", () => {
    const mockValidator = { address: "0.0.3", overstaked: false } as HederaValidator;
    const mockOverstakedValidator = { address: "0.0.3", overstaked: true } as HederaValidator;

    it("returns inactive if validator or validator's address is missing", () => {
      expect(getDelegationStatus(null)).toBe("inactive");
      expect(getDelegationStatus({ address: "" } as any)).toBe("inactive");
    });

    it("returns overstaked if validator.overstaked is true", () => {
      expect(getDelegationStatus(mockOverstakedValidator)).toBe("overstaked");
    });

    it("returns active otherwise", () => {
      expect(getDelegationStatus(mockValidator)).toBe("active");
    });
  });

  describe("filterValidatorBySearchTerm", () => {
    const mockValidator: HederaValidator = {
      nodeId: 123,
      name: "Validator Test",
      address: "0.0.456",
      addressChecksum: "abcde",
      minStake: new BigNumber(0),
      maxStake: new BigNumber(0),
      activeStake: new BigNumber(0),
      activeStakePercentage: new BigNumber(0),
      overstaked: false,
    };

    it("should match by nodeId", () => {
      expect(filterValidatorBySearchTerm(mockValidator, "123")).toBe(true);
    });

    it("should match by name with case insensitivity", () => {
      expect(filterValidatorBySearchTerm(mockValidator, "validator")).toBe(true);
      expect(filterValidatorBySearchTerm(mockValidator, "VALIDATOR")).toBe(true);
      expect(filterValidatorBySearchTerm(mockValidator, "test")).toBe(true);
      expect(filterValidatorBySearchTerm(mockValidator, "unknown")).toBe(false);
    });

    it("should match by address", () => {
      expect(filterValidatorBySearchTerm(mockValidator, "0.0.456")).toBe(true);
      expect(filterValidatorBySearchTerm(mockValidator, "456")).toBe(true);
      expect(filterValidatorBySearchTerm(mockValidator, "789")).toBe(false);
    });

    it("should match by address with checksum", () => {
      expect(filterValidatorBySearchTerm(mockValidator, "0.0.456-abcde")).toBe(true);
      expect(filterValidatorBySearchTerm(mockValidator, "abcde")).toBe(true);
      expect(filterValidatorBySearchTerm(mockValidator, "ABC")).toBe(true);
    });

    it("should handle validator without checksum", () => {
      const validatorWithoutChecksum = { ...mockValidator, addressChecksum: null };
      expect(filterValidatorBySearchTerm(validatorWithoutChecksum, "0.0.456")).toBe(true);
      expect(filterValidatorBySearchTerm(validatorWithoutChecksum, "abcde")).toBe(false);
    });

    it("should handle empty search term", () => {
      expect(filterValidatorBySearchTerm(mockValidator, "")).toBe(true);
    });

    it("should handle partial matches", () => {
      expect(filterValidatorBySearchTerm(mockValidator, "valid")).toBe(true);
      expect(filterValidatorBySearchTerm(mockValidator, "0.0")).toBe(true);
      expect(filterValidatorBySearchTerm(mockValidator, "12")).toBe(true);
    });
  });

  describe("hasSpecificIntentData", () => {
    it("should return true when txIntent has data matching expected type", () => {
      const stakingTxIntent = {
        data: { type: "staking" as const },
      } as TransactionIntent<HederaMemo, HederaTxData>;
      const erc20TxIntent = {
        data: { type: "erc20" as const },
      } as TransactionIntent<HederaMemo, HederaTxData>;

      expect(hasSpecificIntentData(stakingTxIntent, "staking")).toBe(true);
      expect(hasSpecificIntentData(erc20TxIntent, "erc20")).toBe(true);
    });

    it("should return false when txIntent has invalid data", () => {
      const txIntentNoData = {} as TransactionIntent<HederaMemo, HederaTxData>;
      const txIntentUnknown = {
        data: { type: "unknown" as const },
      } as unknown as TransactionIntent<HederaMemo, HederaTxData>;

      expect(hasSpecificIntentData(txIntentUnknown, "erc20")).toBe(false);
      expect(hasSpecificIntentData(txIntentNoData, "erc20")).toBe(false);
    });
  });

  describe("getOperationDetailsExtraFields", () => {
    it("should return empty array when no fields are present", () => {
      const result = getOperationDetailsExtraFields({});

      expect(result).toEqual([]);
    });

    it("should handle zero values correctly", () => {
      const result = getOperationDetailsExtraFields({
        gasConsumed: 0,
        targetStakingNodeId: 0,
      });

      expect(result).toEqual([
        { key: "targetStakingNodeId", value: "0" },
        { key: "gasConsumed", value: "0" },
      ]);
    });

    it("should return all fields when all are present", () => {
      const result = getOperationDetailsExtraFields({
        memo: "complete",
        associatedTokenId: "123",
        targetStakingNodeId: 5,
        previousStakingNodeId: 3,
        gasConsumed: 1000,
        gasUsed: 950,
        gasLimit: 2000,
      });

      expect(result).toEqual([
        { key: "memo", value: "complete" },
        { key: "associatedTokenId", value: "123" },
        { key: "targetStakingNodeId", value: "5" },
        { key: "previousStakingNodeId", value: "3" },
        { key: "gasConsumed", value: "1000" },
        { key: "gasUsed", value: "950" },
        { key: "gasLimit", value: "2000" },
      ]);
    });
  });

  describe("calculateAPY", () => {
    it("should calculate APY correctly for a typical reward rate", () => {
      const result = calculateAPY(3538);

      expect(result).toBeCloseTo(0.01291, 5);
    });

    it("should return 0 for zero reward rate", () => {
      const result = calculateAPY(0);

      expect(result).toBe(0);
    });
  });

  describe("calculateUncommittedBalanceChange", () => {
    const mockAddress = "0.0.12345";
    const mockStartTimestamp = "1762202064.065172388";
    const mockEndTimestamp = "1762202074.065172388";

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should return 0 when there are no transactions in the time range", async () => {
      (apiClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValueOnce([]);

      const result = await calculateUncommittedBalanceChange({
        address: mockAddress,
        startTimestamp: mockStartTimestamp,
        endTimestamp: mockEndTimestamp,
      });

      expect(result).toEqual(new BigNumber(0));
      expect(apiClient.getTransactionsByTimestampRange).toHaveBeenCalledTimes(1);
      expect(apiClient.getTransactionsByTimestampRange).toHaveBeenCalledWith({
        address: mockAddress,
        startTimestamp: `gt:${mockStartTimestamp}`,
        endTimestamp: `lte:${mockEndTimestamp}`,
      });
    });

    it("should calculate balance change with mixed incoming and outgoing transfers", async () => {
      const mockTransactions = [
        {
          consensus_timestamp: "1762202065.000000000",
          transfers: [
            { account: mockAddress, amount: 2000 },
            { account: "0.0.98", amount: -2000 },
          ],
        },
        {
          consensus_timestamp: "1762202070.000000000",
          transfers: [
            { account: mockAddress, amount: -500 },
            { account: "0.0.99", amount: 500 },
          ],
        },
        {
          consensus_timestamp: "1762202072.000000000",
          transfers: [
            { account: mockAddress, amount: 300 },
            { account: "0.0.100", amount: -300 },
          ],
        },
      ] as HederaMirrorTransaction[];

      (apiClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValueOnce(
        mockTransactions,
      );

      const result = await calculateUncommittedBalanceChange({
        address: mockAddress,
        startTimestamp: mockStartTimestamp,
        endTimestamp: mockEndTimestamp,
      });

      expect(result).toEqual(new BigNumber(1800)); // 2000 - 500 + 300
    });

    it("should ignore transfers for other accounts", async () => {
      const mockTransactions = [
        {
          consensus_timestamp: "1762202065.000000000",
          transfers: [
            { account: "0.0.98", amount: 5000 },
            { account: "0.0.99", amount: -5000 },
          ],
        },
        {
          consensus_timestamp: "1762202070.000000000",
          transfers: [
            { account: mockAddress, amount: 1000 },
            { account: "0.0.100", amount: -1000 },
          ],
        },
      ] as HederaMirrorTransaction[];

      (apiClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValueOnce(
        mockTransactions,
      );

      const result = await calculateUncommittedBalanceChange({
        address: mockAddress,
        startTimestamp: mockStartTimestamp,
        endTimestamp: mockEndTimestamp,
      });

      expect(result).toEqual(new BigNumber(1000));
    });

    it("should return 0 when timestamps are equal or invalid", async () => {
      (apiClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValueOnce([]);

      const [resultEqual, resultInvalid] = await Promise.all([
        calculateUncommittedBalanceChange({
          address: mockAddress,
          startTimestamp: mockStartTimestamp,
          endTimestamp: mockStartTimestamp,
        }),
        calculateUncommittedBalanceChange({
          address: mockAddress,
          startTimestamp: mockEndTimestamp,
          endTimestamp: mockStartTimestamp,
        }),
      ]);

      expect(resultEqual).toEqual(new BigNumber(0));
      expect(resultInvalid).toEqual(new BigNumber(0));
    });
  });

  describe("analyzeStakingOperation", () => {
    const mockAddress = "0.0.12345";
    const mockTimestamp = "1762202064.065172388";
    const mockTx = {
      consensus_timestamp: mockTimestamp,
      name: "CRYPTOUPDATEACCOUNT",
    } as HederaMirrorTransaction;

    beforeEach(() => {
      jest.resetAllMocks();
    });

    it("detects DELEGATE operation when staking starts", async () => {
      const accountBefore = getMockedMirrorAccount({ staked_node_id: null });
      const accountAfter = getMockedMirrorAccount({ staked_node_id: 5 });

      (apiClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValueOnce([]);
      (apiClient.getAccount as jest.Mock)
        .mockResolvedValueOnce(accountBefore)
        .mockResolvedValueOnce(accountAfter);

      const result = await analyzeStakingOperation(mockAddress, mockTx);

      expect(result).toEqual({
        operationType: "DELEGATE",
        previousStakingNodeId: null,
        targetStakingNodeId: 5,
        stakedAmount: BigInt(1000),
      });
      expect(apiClient.getAccount).toHaveBeenCalledTimes(2);
      expect(apiClient.getAccount).toHaveBeenCalledWith(mockAddress, `lt:${mockTimestamp}`);
      expect(apiClient.getAccount).toHaveBeenCalledWith(mockAddress, `eq:${mockTimestamp}`);
    });

    it("detects UNDELEGATE operation when staking stops", async () => {
      const accountBefore = getMockedMirrorAccount({ staked_node_id: 5 });
      const accountAfter = getMockedMirrorAccount({ staked_node_id: null });

      (apiClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValueOnce([]);
      (apiClient.getAccount as jest.Mock)
        .mockResolvedValueOnce(accountBefore)
        .mockResolvedValueOnce(accountAfter);

      const result = await analyzeStakingOperation(mockAddress, mockTx);

      expect(result).toEqual({
        operationType: "UNDELEGATE",
        previousStakingNodeId: 5,
        targetStakingNodeId: null,
        stakedAmount: BigInt(1000),
      });
    });

    it("detects REDELEGATE operation when changing nodes", async () => {
      const accountBefore = getMockedMirrorAccount({ staked_node_id: 3 });
      const accountAfter = getMockedMirrorAccount({ staked_node_id: 10 });

      (apiClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValueOnce([]);
      (apiClient.getAccount as jest.Mock)
        .mockResolvedValueOnce(accountBefore)
        .mockResolvedValueOnce(accountAfter);

      const result = await analyzeStakingOperation(mockAddress, mockTx);

      expect(result).toEqual({
        operationType: "REDELEGATE",
        previousStakingNodeId: 3,
        targetStakingNodeId: 10,
        stakedAmount: BigInt(1000),
      });
    });

    it("calculates correct staked amount with uncommitted transactions", async () => {
      const mockBalance = { balance: 1000000, timestamp: "1762202060.000000000", tokens: [] };
      const mockAccountBefore = getMockedMirrorAccount({
        account: mockAddress,
        staked_node_id: null,
        balance: mockBalance,
      });
      const mockAccountAfter = getMockedMirrorAccount({
        account: mockAddress,
        staked_node_id: 5,
        balance: mockBalance,
      });
      const mockTransactionsMissingInBalance = [
        {
          consensus_timestamp: `${Math.floor(Number(mockBalance.timestamp)) + 5}.000000000`,
          transfers: [
            { account: mockAddress, amount: -100000 },
            { account: "0.0.98", amount: 100000 },
          ],
        },
      ] as HederaMirrorTransaction[];

      (apiClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValueOnce(
        mockTransactionsMissingInBalance,
      );
      (apiClient.getAccount as jest.Mock)
        .mockResolvedValueOnce(mockAccountBefore)
        .mockResolvedValueOnce(mockAccountAfter);

      const result = await analyzeStakingOperation(mockAddress, mockTx);

      expect(apiClient.getTransactionsByTimestampRange).toHaveBeenCalledTimes(1);
      expect(apiClient.getTransactionsByTimestampRange).toHaveBeenCalledWith({
        address: mockAddress,
        startTimestamp: `gt:${mockAccountBefore.balance.timestamp}`,
        endTimestamp: `lte:${mockTimestamp}`,
      });
      expect(result).toEqual({
        operationType: "DELEGATE",
        previousStakingNodeId: null,
        targetStakingNodeId: 5,
        stakedAmount: BigInt(900000),
      });
    });

    it("returns null for regular account update (both null)", async () => {
      const accountBefore = getMockedMirrorAccount({ staked_node_id: null });
      const accountAfter = getMockedMirrorAccount({ staked_node_id: null });

      (apiClient.getAccount as jest.Mock)
        .mockResolvedValueOnce(accountBefore)
        .mockResolvedValueOnce(accountAfter);

      const result = await analyzeStakingOperation(mockAddress, mockTx);

      expect(result).toBeNull();
    });

    it("returns null when staked node doesn't change", async () => {
      const accountBefore = getMockedMirrorAccount({ staked_node_id: 5 });
      const accountAfter = getMockedMirrorAccount({ staked_node_id: 5 });

      (apiClient.getAccount as jest.Mock)
        .mockResolvedValueOnce(accountBefore)
        .mockResolvedValueOnce(accountAfter);

      const result = await analyzeStakingOperation(mockAddress, mockTx);

      expect(result).toBeNull();
    });
  });
});
