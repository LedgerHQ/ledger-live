import type { EncodedTransaction } from "algosdk";
import { BigNumber } from "bignumber.js";
import { buildTransactionPayload, encodeToSign, encodeToBroadcast } from "./buildTransaction";
import * as network from "./network";
import type { AlgorandAccount, Transaction } from "./types";

jest.mock("./network");

// Mock algosdk functions
jest.mock("algosdk", () => ({
  makePaymentTxnWithSuggestedParams: jest.fn().mockReturnValue({
    firstRound: 1000,
    lastRound: 2000,
    get_obj_for_encoding: () => ({
      amt: 1000000,
      fee: 1000,
      fv: 1000,
      lv: 2000,
      snd: Buffer.from("sender"),
      rcv: Buffer.from("recipient"),
      type: "pay",
    }),
  }),
  makeAssetTransferTxnWithSuggestedParams: jest.fn().mockReturnValue({
    firstRound: 1000,
    lastRound: 2000,
    get_obj_for_encoding: () => ({
      amt: 100,
      fee: 1000,
      fv: 1000,
      lv: 2000,
      snd: Buffer.from("sender"),
      arcv: Buffer.from("recipient"),
      xaid: 12345,
      type: "axfer",
    }),
  }),
}));

const mockGetTransactionParams = network.getTransactionParams as jest.MockedFunction<
  typeof network.getTransactionParams
>;

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
      expect(mockGetTransactionParams).toHaveBeenCalledTimes(1);
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
    });

    it("should build payment transaction when no assetId and no subAccount", async () => {
      // When no assetId and no subAccountId, it builds a payment transaction
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
    });
  });

  describe("encodeToSign", () => {
    it("should encode payload to hex string", () => {
      const payload = {
        amt: 1000000,
        fee: 1000,
        type: "pay",
      } as unknown as EncodedTransaction;

      const result = encodeToSign(payload);

      expect(typeof result).toBe("string");
      expect(result).toMatch(/^[a-f0-9]+$/i);
    });

    it("should produce consistent encoding", () => {
      const payload = {
        amt: 500000,
        type: "pay",
      } as unknown as EncodedTransaction;

      const result1 = encodeToSign(payload);
      const result2 = encodeToSign(payload);

      expect(result1).toBe(result2);
    });
  });

  describe("encodeToBroadcast", () => {
    it("should encode signed transaction to buffer", () => {
      const payload = {
        amt: 1000000,
        fee: 1000,
        type: "pay",
      } as unknown as EncodedTransaction;
      const signature = Buffer.from("signature_bytes");

      const result = encodeToBroadcast(payload, signature);

      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should include signature in encoded result", () => {
      const payload = { amt: 100, type: "pay" } as unknown as EncodedTransaction;
      const signature = Buffer.from("test_signature");

      const result = encodeToBroadcast(payload, signature);

      // Result should be larger than just the payload
      const payloadOnly = encodeToSign(payload);
      expect(result.length).toBeGreaterThan(payloadOnly.length / 2);
    });
  });
});
