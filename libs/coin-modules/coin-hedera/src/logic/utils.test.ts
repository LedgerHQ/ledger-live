import BigNumber from "bignumber.js";
import { createHash } from "crypto";
import { Transaction } from "@hashgraph/sdk";
import type { AssetInfo } from "@ledgerhq/coin-framework/api/types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { InvalidAddress } from "@ledgerhq/errors";
import { HEDERA_TRANSACTION_MODES, SYNTHETIC_BLOCK_WINDOW_SECONDS } from "../constants";
import { apiClient } from "../network/api";
import { getMockedOperation } from "../test/fixtures/operation.fixture";
import { getMockedTokenCurrency } from "../test/fixtures/currency.fixture";
import { getMockedAccount, getMockedTokenAccount } from "../test/fixtures/account.fixture";
import {
  serializeSignature,
  deserializeSignature,
  serializeTransaction,
  deserializeTransaction,
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
} from "./utils";
import { HederaRecipientInvalidChecksum } from "../errors";

jest.mock("../network/api");

describe("utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      jest.spyOn(Transaction, "fromBytes");
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should serialize a transaction to hex", () => {
      const mockTransaction = {
        toBytes: jest.fn().mockReturnValue(Buffer.from([10, 20, 30, 40, 50])),
      } as unknown as Transaction;

      const serialized = serializeTransaction(mockTransaction);

      expect(serialized).toBe("0a141e2832");
      expect(mockTransaction.toBytes).toHaveBeenCalled();
    });

    it("should deserialize a hex string to a Transaction", () => {
      const mockTransaction = { id: "mock-transaction-id" };
      (Transaction.fromBytes as jest.Mock).mockReturnValue(mockTransaction);

      const hexTransaction = "0a141e2832";
      const deserialized = deserializeTransaction(hexTransaction);

      const hexTransactionBuffer = Buffer.from([10, 20, 30, 40, 50]);
      expect(Transaction.fromBytes).toHaveBeenCalledTimes(1);
      expect(Transaction.fromBytes).toHaveBeenCalledWith(hexTransactionBuffer);
      expect(deserialized).toBe(mockTransaction);
    });
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

  it("should substract fee from value for native OUT operations", () => {
    const operation = getMockedOperation({
      type: "OUT",
      value: BigNumber(1000),
      fee: BigNumber(100),
    });

    expect(getOperationValue({ asset: nativeAsset, operation })).toBe(BigInt(900));
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

  describe("getTransactionExplorer", () => {
    test("Tx explorer URL is converted from hash to consensus timestamp", async () => {
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

    test("Tx explorer URL is based on transaction id if consensus timestamp is not available", async () => {
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
    test("returns correct value based on tx.properties", () => {
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
    test("returns value based on isAutoTokenAssociationEnabled flag", () => {
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
    test("should return false if token is already associated (token account exists)", () => {
      const mockedTokenCurrency = getMockedTokenCurrency();
      const mockedTokenAccount = getMockedTokenAccount(mockedTokenCurrency);
      const mockedAccount = getMockedAccount({ subAccounts: [mockedTokenAccount] });

      expect(isTokenAssociationRequired(mockedAccount, mockedTokenCurrency)).toBe(false);
    });

    test("should return false if auto token associations are enabled", () => {
      const mockedTokenCurrency = getMockedTokenCurrency();
      const mockedAccount = getMockedAccount({
        subAccounts: [],
        hederaResources: {
          maxAutomaticTokenAssociations: -1,
          isAutoTokenAssociationEnabled: true,
        },
      });

      expect(isTokenAssociationRequired(mockedAccount, mockedTokenCurrency)).toBe(false);
    });

    test("should return true if token is not associated and auto associations are disabled", () => {
      const mockedTokenCurrency = getMockedTokenCurrency();
      const mockedAccount = getMockedAccount({ subAccounts: [] });

      expect(isTokenAssociationRequired(mockedAccount, mockedTokenCurrency)).toBe(true);
    });

    test("should return false if token is undefined", () => {
      const mockedAccount = getMockedAccount({ subAccounts: [] });

      expect(isTokenAssociationRequired(mockedAccount, undefined)).toBe(false);
    });

    test("should return false for legacy accounts without subAccounts or hederaResources", () => {
      const mockedTokenCurrency = getMockedTokenCurrency();
      const mockedAccount = getMockedAccount();

      delete mockedAccount.subAccounts;
      delete mockedAccount.hederaResources;

      expect(isTokenAssociationRequired(mockedAccount, mockedTokenCurrency)).toBe(true);
    });
  });

  describe("isValidExtra", () => {
    test("returns true for object and false for invalid types", () => {
      expect(isValidExtra({ some: "value" })).toBe(true);
      expect(isValidExtra(null)).toBe(false);
      expect(isValidExtra(undefined)).toBe(false);
      expect(isValidExtra("string")).toBe(false);
      expect(isValidExtra(123)).toBe(false);
      expect(isValidExtra([])).toBe(false);
    });
  });

  describe("sendRecipientCanNext", () => {
    test("handles association warnings", () => {
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
    const tokenId = "0.0.5678";

    beforeEach(() => {
      jest.clearAllMocks();
      // reset LRU cache to make sure all tests receive correct mocks from mockedGetAccount
      checkAccountTokenAssociationStatus.clear(`${accountId}-${tokenId}`);
    });

    test("returns true if max_automatic_token_associations === -1", async () => {
      (apiClient.getAccount as jest.Mock).mockResolvedValueOnce({
        account: accountId,
        max_automatic_token_associations: -1,
        balance: {
          balance: 0,
          timestamp: "",
          tokens: [],
        },
      });

      const result = await checkAccountTokenAssociationStatus(accountId, tokenId);
      expect(result).toBe(true);
    });

    test("returns true if token is already associated", async () => {
      (apiClient.getAccount as jest.Mock).mockResolvedValueOnce({
        account: accountId,
        max_automatic_token_associations: 0,
        balance: {
          balance: 1,
          timestamp: "",
          tokens: [{ token_id: tokenId, balance: 1 }],
        },
      });

      const result = await checkAccountTokenAssociationStatus(accountId, tokenId);
      expect(result).toBe(true);
    });

    test("returns false if token is not associated", async () => {
      (apiClient.getAccount as jest.Mock).mockResolvedValueOnce({
        account: accountId,
        max_automatic_token_associations: 0,
        balance: {
          balance: 1,
          timestamp: "",
          tokens: [{ token_id: "0.0.9999", balance: 1 }],
        },
      });

      const result = await checkAccountTokenAssociationStatus(accountId, tokenId);
      expect(result).toBe(false);
    });

    test("supports addresses with checksum", async () => {
      const addressWithChecksum = "0.0.9124531-xrxlv";

      (apiClient.getAccount as jest.Mock).mockResolvedValueOnce({
        account: accountId,
        max_automatic_token_associations: 0,
        balance: {
          balance: 1,
          timestamp: "",
          tokens: [{ token_id: "0.0.9999", balance: 1 }],
        },
      });

      await checkAccountTokenAssociationStatus(addressWithChecksum, tokenId);
      expect(apiClient.getAccount).toHaveBeenCalledTimes(1);
      expect(apiClient.getAccount).toHaveBeenCalledWith("0.0.9124531");
    });
  });

  describe("safeParseAccountId", () => {
    test("returns account id and no checksum for valid address without checksum", () => {
      const [error, result] = safeParseAccountId("0.0.9124531");

      expect(error).toBeNull();
      expect(result?.accountId).toBe("0.0.9124531");
      expect(result?.checksum).toBeNull();
    });

    test("returns account id and checksum for valid address with correct checksum", () => {
      const [error, result] = safeParseAccountId("0.0.9124531-xrxlv");

      expect(error).toBeNull();
      expect(result?.accountId).toBe("0.0.9124531");
      expect(result?.checksum).toBe("xrxlv");
    });

    test("returns error for valid address with incorrect checksum", () => {
      const [error, accountId] = safeParseAccountId("0.0.9124531-invld");

      expect(error).toBeInstanceOf(HederaRecipientInvalidChecksum);
      expect(accountId).toBeNull();
    });

    test("returns error for invalid address format", () => {
      const [error, accountId] = safeParseAccountId("not-a-valid-address");

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
});
