import * as v8 from "v8";
import { BigNumber } from "bignumber.js";
import { buildTransactionPayload, encodeToSign, encodeToBroadcast } from "./buildTransaction";
import * as network from "./network";
import type { AlgorandAccount, Transaction } from "./types";

jest.mock("./network");

jest.mock("algosdk", () => {
  class SignedTransaction {
    sig: Uint8Array;
    txn: unknown;
    constructor({ sig, txn }: { sig: Uint8Array; txn: unknown }) {
      this.sig = sig;
      this.txn = txn;
    }
  }
  return {
    base64ToBytes: jest.fn((b64: string) => Buffer.from(b64, "base64")),
    encodeMsgpack: jest.fn((obj: unknown) => v8.serialize(obj)),
    SignedTransaction,
    makePaymentTxnWithSuggestedParamsFromObject: jest.fn(
      (params: {
        sender: string;
        receiver: string;
        amount: number;
        suggestedParams: unknown;
        note?: Uint8Array;
      }) => ({
        sender: params.sender,
        receiver: params.receiver,
        amount: params.amount,
        type: "pay",
        suggestedParams: params.suggestedParams,
        ...(params.note ? { note: params.note } : {}),
      }),
    ),
    makeAssetTransferTxnWithSuggestedParamsFromObject: jest.fn(
      (params: {
        sender: string;
        receiver: string;
        amount: number;
        assetIndex: number;
        suggestedParams: unknown;
        note?: Uint8Array;
      }) => ({
        sender: params.sender,
        receiver: params.receiver,
        amount: params.amount,
        assetIndex: params.assetIndex,
        type: "axfer",
        suggestedParams: params.suggestedParams,
        ...(params.note ? { note: params.note } : {}),
      }),
    ),
  };
});

const mockGetTransactionParams = network.getTransactionParams as jest.MockedFunction<
  typeof network.getTransactionParams
>;

const algosdk = jest.requireMock("algosdk");

describe("buildTransaction", () => {
  const mockAccount = {
    freshAddress: "ALGO_ADDRESS_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    subAccounts: [],
  } as unknown as AlgorandAccount;

  const defaultParams = {
    fee: 0,
    minFee: 1000,
    firstRound: 50000000,
    lastRound: 50001000,
    genesisHash: "wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=",
    genesisID: "mainnet-v1.0",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTransactionParams.mockResolvedValue(defaultParams);
  });

  describe("buildTransactionPayload", () => {
    it("should build a payment transaction payload", async () => {
      const transaction: Transaction = {
        family: "algorand",
        mode: "send",
        amount: new BigNumber("1000000"),
        recipient: "RECIPIENT_ADDRESS",
        fees: null,
        memo: undefined,
        assetId: undefined,
      };

      const result = await buildTransactionPayload(mockAccount, transaction);

      expect(result).not.toBeUndefined();
      expect(result.type).toBe("pay");
      expect(result.amount).toBe(1000000);
      expect(result.sender).toBe(mockAccount.freshAddress);
      expect(result.receiver).toBe("RECIPIENT_ADDRESS");
      expect(mockGetTransactionParams).toHaveBeenCalledTimes(1);
      expect(algosdk.makePaymentTxnWithSuggestedParamsFromObject).toHaveBeenCalled();
    });

    it("should build a transaction with memo", async () => {
      const transaction: Transaction = {
        family: "algorand",
        mode: "send",
        amount: new BigNumber("1000000"),
        recipient: "RECIPIENT_ADDRESS",
        fees: null,
        memo: "Test payment",
        assetId: undefined,
      };

      const result = await buildTransactionPayload(mockAccount, transaction);

      expect(result).not.toBeUndefined();
      expect(result.note).toEqual(new TextEncoder().encode("Test payment"));
    });

    it("should build an asset transfer transaction for optIn", async () => {
      const transaction: Transaction = {
        family: "algorand",
        mode: "optIn",
        amount: new BigNumber("0"),
        recipient: "ALGO_ADDRESS",
        fees: null,
        memo: undefined,
        assetId: "algorand/asa/12345",
      };

      const result = await buildTransactionPayload(mockAccount, transaction);

      expect(result).not.toBeUndefined();
      expect(result.type).toBe("axfer");
      expect(result.assetIndex).toBe(12345);
      expect(algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject).toHaveBeenCalled();
    });

    it("should build payment transaction when no assetId and no subAccount", async () => {
      const transaction: Transaction = {
        family: "algorand",
        mode: "send",
        amount: new BigNumber("1000000"),
        recipient: "ALGO_ADDRESS",
        fees: null,
        memo: undefined,
        assetId: undefined,
      };

      const result = await buildTransactionPayload(mockAccount, transaction);

      expect(result).not.toBeUndefined();
      expect(result.type).toBe("pay");
      expect(algosdk.makePaymentTxnWithSuggestedParamsFromObject).toHaveBeenCalled();
    });

    it("should use subAccount token for asset transfer", async () => {
      const accountWithSubAccount = {
        ...mockAccount,
        subAccounts: [
          {
            id: "sub-account-1",
            type: "TokenAccount",
            token: { id: "algorand/asa/67890" },
          },
        ],
      } as unknown as AlgorandAccount;

      const transaction: Transaction = {
        family: "algorand",
        mode: "send",
        amount: new BigNumber("100"),
        recipient: "RECIPIENT_ADDRESS",
        fees: null,
        memo: undefined,
        subAccountId: "sub-account-1",
      };

      const result = await buildTransactionPayload(accountWithSubAccount, transaction);

      expect(result).not.toBeUndefined();
      expect(result.type).toBe("axfer");
      expect(result.assetIndex).toBe(67890);
    });

    it("should pass genesisHash as bytes in suggestedParams", async () => {
      const transaction: Transaction = {
        family: "algorand",
        mode: "send",
        amount: new BigNumber("1000000"),
        recipient: "RECIPIENT_ADDRESS",
        fees: null,
        memo: undefined,
        assetId: undefined,
      };

      await buildTransactionPayload(mockAccount, transaction);

      expect(algosdk.base64ToBytes).toHaveBeenCalledWith(defaultParams.genesisHash);
    });
  });

  describe("encodeToSign", () => {
    it("should encode payload to hex string", () => {
      const payload = {
        amt: 1000000,
        fee: 1000,
        type: "pay",
      };

      const result = encodeToSign(payload as any);

      expect(typeof result).toBe("string");
      expect(result).toMatch(/^[a-f0-9]+$/i);
      expect(algosdk.encodeMsgpack).toHaveBeenCalledWith(payload);
    });

    it("should produce consistent encoding", () => {
      const payload = {
        amt: 500000,
        type: "pay",
      };

      const result1 = encodeToSign(payload as any);
      const result2 = encodeToSign(payload as any);

      expect(result1).toBe(result2);
    });
  });

  describe("encodeToBroadcast", () => {
    it("should encode signed transaction to buffer", () => {
      const payload = {
        amt: 1000000,
        fee: 1000,
        type: "pay",
      };
      const signature = Buffer.alloc(66, 0xab);

      const result = encodeToBroadcast(payload as any, signature);

      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should truncate signature to 64 bytes", () => {
      const payload = { amt: 100, type: "pay" };
      const signature = Buffer.alloc(66, 0xcd);

      encodeToBroadcast(payload as any, signature);

      const signedArg = (algosdk.encodeMsgpack as jest.Mock).mock.calls.at(-1)?.[0];
      expect(signedArg).toBeInstanceOf(algosdk.SignedTransaction);
      expect(signedArg.sig.length).toBe(64);
    });
  });
});
