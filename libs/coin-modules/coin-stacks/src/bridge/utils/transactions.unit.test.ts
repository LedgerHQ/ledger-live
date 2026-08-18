import { TokenAccount } from "@ledgerhq/types-live";
import { StacksTransactionWire, AnchorMode } from "@stacks/transactions";
import { makeUnsignedSTXTokenTransfer, makeUnsignedContractCall } from "@stacks/transactions";
import BigNumber from "bignumber.js";
import { StacksNetwork } from "../../network/api";
import { FamilyType, Transaction } from "../../types";
import { getTokenContractDetails, createTransaction, getTxToBroadcast } from "./transactions";

// Mock dependencies
jest.mock("@stacks/transactions", () => {
  const originalModule = jest.requireActual("@stacks/transactions");
  return {
    ...originalModule,
    makeUnsignedSTXTokenTransfer: jest.fn(),
    makeUnsignedContractCall: jest.fn(),
    createMessageSignature: jest.fn(),
    standardPrincipalCV: jest.fn(),
    uintCV: jest.fn(),
  };
});

jest.mock("../../common-logic/memoUtils", () => ({
  memoToBufferCV: jest.fn(),
}));

describe("transactions utility functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getTokenContractDetails", () => {
    test("should extract token contract details from TokenAccount", () => {
      const tokenAccount = {
        token: {
          contractAddress: "SP123456789ABCDEF.token-contract::TOKEN-X",
        },
      } as TokenAccount;

      const result = getTokenContractDetails(tokenAccount);

      expect(result).toEqual({
        contractAddress: "SP123456789ABCDEF",
        contractName: "token-contract",
        assetName: "TOKEN-X",
      });
    });

    test("should handle missing contractName or assetName in token id", () => {
      const tokenAccount = {
        token: {
          contractAddress: "SP123456789ABCDEF.token-contract",
        },
      } as TokenAccount;

      const result = getTokenContractDetails(tokenAccount);

      expect(result).toEqual({
        contractAddress: "SP123456789ABCDEF",
        contractName: "token-contract",
        assetName: "",
      });
    });

    test("should return null for undefined subAccount", () => {
      const result = getTokenContractDetails(undefined);

      expect(result).toBeNull();
    });
  });

  describe("createTransaction", () => {
    const mockTx = { serialize: jest.fn() } as unknown as StacksTransactionWire;

    beforeEach(() => {
      (makeUnsignedSTXTokenTransfer as jest.Mock).mockResolvedValue(mockTx);
      (makeUnsignedContractCall as jest.Mock).mockResolvedValue(mockTx);
    });

    test("should create token transfer transaction when subAccount is provided", async () => {
      const transaction: Transaction = {
        family: "stacks" as FamilyType,
        recipient: "SP_RECIPIENT",
        anchorMode: AnchorMode.Any,
        network: "mainnet" as keyof typeof StacksNetwork,
        memo: "Test memo",
        amount: new BigNumber(1000),
      };
      const senderAddress = "SP_SENDER";
      const publicKey = "PUBLIC_KEY";
      const subAccount = {
        token: {
          contractAddress: "SP_CONTRACT",
          id: "SP_CONTRACT.token-contract::TOKEN-X",
        },
      } as TokenAccount;
      const fee = new BigNumber(100);
      const nonce = new BigNumber(5);

      const result = await createTransaction(
        transaction,
        senderAddress,
        publicKey,
        subAccount,
        fee,
        nonce,
      );

      expect(makeUnsignedContractCall).toHaveBeenCalled();
      expect(makeUnsignedSTXTokenTransfer).not.toHaveBeenCalled();
      expect(result).toBe(mockTx);
    });

    test("should create STX transfer transaction when subAccount is not provided", async () => {
      const transaction: Transaction = {
        family: "stacks" as FamilyType,
        recipient: "SP_RECIPIENT",
        anchorMode: AnchorMode.Any,
        network: "mainnet" as keyof typeof StacksNetwork,
        memo: "Test memo",
        amount: new BigNumber(1000),
      };
      const senderAddress = "SP_SENDER";
      const publicKey = "PUBLIC_KEY";
      const fee = new BigNumber(100);
      const nonce = new BigNumber(5);

      const result = await createTransaction(
        transaction,
        senderAddress,
        publicKey,
        undefined,
        fee,
        nonce,
      );

      expect(makeUnsignedSTXTokenTransfer).toHaveBeenCalled();
      expect(makeUnsignedContractCall).not.toHaveBeenCalled();
      expect(result).toBe(mockTx);
    });
  });

  describe("getTxToBroadcast", () => {
    // serialize() returns a hex string on @stacks/transactions@7, not the pre-v7 Uint8Array.
    const mockTx = {
      auth: {
        spendingCondition: {},
      },
      serialize: jest.fn().mockReturnValue("010203"),
    } as unknown as StacksTransactionWire;

    beforeEach(() => {
      (makeUnsignedContractCall as jest.Mock).mockResolvedValue(mockTx);
      (makeUnsignedSTXTokenTransfer as jest.Mock).mockResolvedValue(mockTx);
    });

    test("should create token transfer transaction when token details are provided", async () => {
      const operation = {
        id: "op1",
        hash: "hash1",
        type: "OUT",
        blockHeight: 123,
        blockHash: "blockHash1",
        accountId: "account1",
        date: new Date(),
        value: "1000",
        recipients: ["SP_RECIPIENT"],
        senders: ["SP_SENDER"],
        fee: new BigNumber(100),
        extra: { memo: "Test memo" },
        transactionSequenceNumber: 5,
      };
      const signature = "SIGNATURE_HEX";
      const rawData = {
        anchorMode: AnchorMode.Any,
        network: "mainnet",
        xpub: "PUBLIC_KEY",
        contractAddress: "SP_CONTRACT",
        contractName: "token-contract",
        assetName: "TOKEN-X",
      };

      const result = await getTxToBroadcast(operation as any, signature, rawData);

      expect(makeUnsignedContractCall).toHaveBeenCalled();
      expect(makeUnsignedSTXTokenTransfer).not.toHaveBeenCalled();
      expect(result).toBeInstanceOf(Buffer);
    });

    test("should create STX transfer transaction when token details are not provided", async () => {
      const operation = {
        id: "op1",
        hash: "hash1",
        type: "OUT",
        blockHeight: 123,
        blockHash: "blockHash1",
        accountId: "account1",
        date: new Date(),
        value: "1100",
        recipients: ["SP_RECIPIENT"],
        senders: ["SP_SENDER"],
        fee: new BigNumber(100),
        extra: { memo: "Test memo" },
        transactionSequenceNumber: 5,
      };
      const signature = "SIGNATURE_HEX";
      const rawData = {
        anchorMode: AnchorMode.Any,
        network: "mainnet",
        xpub: "PUBLIC_KEY",
      };

      const result = await getTxToBroadcast(operation as any, signature, rawData);

      expect(makeUnsignedSTXTokenTransfer).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: "1000",
          recipient: "SP_RECIPIENT",
          fee: "100",
        }),
      );
      expect(makeUnsignedContractCall).not.toHaveBeenCalled();
      expect(result).toBeInstanceOf(Buffer);
    });

    test("should handle null or undefined memo", async () => {
      const operation = {
        id: "op1",
        hash: "hash1",
        type: "OUT",
        blockHeight: 123,
        blockHash: "blockHash1",
        accountId: "account1",
        date: new Date(),
        value: "1100",
        recipients: ["SP_RECIPIENT"],
        senders: ["SP_SENDER"],
        fee: new BigNumber(100),
        extra: { memo: null as null | undefined },
        transactionSequenceNumber: 5,
      };
      const signature = "SIGNATURE_HEX";
      const rawData = {
        anchorMode: AnchorMode.Any,
        network: "mainnet",
        xpub: "PUBLIC_KEY",
      };

      await getTxToBroadcast(operation as any, signature, rawData);

      expect(makeUnsignedSTXTokenTransfer).toHaveBeenCalledWith(
        expect.objectContaining({
          memo: undefined,
        }),
      );

      operation.extra.memo = undefined;
      await getTxToBroadcast(operation as any, signature, rawData);

      expect(makeUnsignedSTXTokenTransfer).toHaveBeenCalledWith(
        expect.objectContaining({
          memo: undefined,
        }),
      );
    });
  });
});
