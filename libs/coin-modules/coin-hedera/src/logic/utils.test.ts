import BigNumber from "bignumber.js";
import { Transaction } from "@hashgraph/sdk";
import type { AssetInfo } from "@ledgerhq/coin-framework/api/types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { hederaMirrorNode } from "../network/mirror";
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
} from "./utils";

jest.mock("@hashgraph/sdk");
jest.mock("../network/mirror");

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
      expect(isTokenAssociateTransaction({ mode: "token-associate" } as any)).toBe(true);
      expect(isTokenAssociateTransaction({ mode: "send" } as any)).toBe(false);
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
      (hederaMirrorNode.getAccount as jest.Mock).mockResolvedValueOnce({
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
      (hederaMirrorNode.getAccount as jest.Mock).mockResolvedValueOnce({
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
      (hederaMirrorNode.getAccount as jest.Mock).mockResolvedValueOnce({
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
  });
});
