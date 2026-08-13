import { TokenAccount } from "@ledgerhq/types-live";
import { StacksTransactionWire, AnchorMode } from "@stacks/transactions";
import {
  makeUnsignedSTXTokenTransfer,
  makeUnsignedContractCall,
  createMessageSignature,
  standardPrincipalCV,
  uintCV,
} from "@stacks/transactions";
import BigNumber from "bignumber.js";
import { StacksNetwork } from "../../network/api";
import { FamilyType, Transaction } from "../../types";
import { memoToBufferCV } from "./memoUtils";
import {
  getTokenContractDetails,
  createTokenTransferFunctionArgs,
  createTokenTransferPostConditions,
  createTokenTransferTransaction,
  createStxTransferTransaction,
  createTransaction,
  applySignatureToTransaction,
  getTxToBroadcast,
} from "./transactions";

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

jest.mock("./memoUtils", () => ({
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

  describe("createTokenTransferFunctionArgs", () => {
    beforeEach(() => {
      (memoToBufferCV as jest.Mock).mockReturnValue("MOCK_MEMO_BUFFER_CV");
      (standardPrincipalCV as jest.Mock).mockImplementation(addr => `MOCK_PRINCIPAL_${addr}`);
      (uintCV as jest.Mock).mockImplementation(val => `MOCK_UINT_${val}`);
    });

    test("should create function args with memo", () => {
      const amount = new BigNumber(1000);
      const senderAddress = "SP_SENDER";
      const recipientAddress = "SP_RECIPIENT";
      const memo = "Test memo";

      const result = createTokenTransferFunctionArgs(amount, senderAddress, recipientAddress, memo);

      expect(result).toEqual([
        "MOCK_UINT_1000",
        "MOCK_PRINCIPAL_SP_SENDER",
        "MOCK_PRINCIPAL_SP_RECIPIENT",
        "MOCK_MEMO_BUFFER_CV",
      ]);
      expect(memoToBufferCV).toHaveBeenCalledWith(memo);
    });

    test("should create function args without memo", () => {
      const amount = new BigNumber(1000);
      const senderAddress = "SP_SENDER";
      const recipientAddress = "SP_RECIPIENT";

      const result = createTokenTransferFunctionArgs(amount, senderAddress, recipientAddress);

      expect(result).toEqual([
        "MOCK_UINT_1000",
        "MOCK_PRINCIPAL_SP_SENDER",
        "MOCK_PRINCIPAL_SP_RECIPIENT",
        "MOCK_MEMO_BUFFER_CV",
      ]);
      expect(memoToBufferCV).toHaveBeenCalledWith(undefined);
    });
  });

  describe("createTokenTransferPostConditions", () => {
    test("should create post conditions for token transfer", () => {
      const senderAddress = "SP_SENDER";
      const amount = new BigNumber(1000);
      const contractAddress = "SP_CONTRACT";
      const contractName = "token-contract";
      const assetName = "TOKEN-X";

      const result = createTokenTransferPostConditions(
        senderAddress,
        amount,
        contractAddress,
        contractName,
        assetName,
      );

      expect(result).toEqual(
        expect.arrayContaining([
          {
            type: "ft-postcondition",
            address: senderAddress,
            condition: "eq",
            asset: "SP_CONTRACT.token-contract::TOKEN-X",
            amount: BigInt(1000),
          },
        ]),
      );
    });

    test("should use lte condition for special tokens", () => {
      const result = createTokenTransferPostConditions(
        "SP_SENDER",
        new BigNumber(1000),
        "SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM",
        "auto-alex-v3",
        "auto-alex-v3",
      );

      expect(result[0]).toEqual(
        expect.objectContaining({ condition: "lte", type: "ft-postcondition" }),
      );
    });
  });

  describe("createTokenTransferTransaction", () => {
    const mockTx = { serialize: jest.fn() } as unknown as StacksTransactionWire;

    beforeEach(() => {
      (makeUnsignedContractCall as jest.Mock).mockResolvedValue(mockTx);
    });

    test("should create token transfer transaction with all parameters", async () => {
      const contractAddress = "SP_CONTRACT";
      const contractName = "token-contract";
      const assetName = "TOKEN-X";
      const amount = new BigNumber(1000);
      const senderAddress = "SP_SENDER";
      const recipientAddress = "SP_RECIPIENT";
      const anchorMode = AnchorMode.Any;
      const network = "mainnet";
      const publicKey = "PUBLIC_KEY";
      const fee = new BigNumber(100);
      const nonce = new BigNumber(5);
      const memo = "Test memo";

      const result = await createTokenTransferTransaction({
        contractAddress,
        contractName,
        assetName,
        amount,
        senderAddress,
        recipientAddress,
        anchorMode,
        network,
        publicKey,
        fee,
        nonce,
        memo,
      });

      // anchorMode is accepted by createTokenTransferTransaction for call-site compatibility but is
      // no longer forwarded: @stacks/transactions@7's ContractCallOptions dropped the field.
      void anchorMode;
      expect(makeUnsignedContractCall).toHaveBeenCalledWith(
        expect.objectContaining({
          contractAddress,
          contractName,
          functionName: "transfer",
          network,
          publicKey,
          fee: "100",
          nonce: "5",
        }),
      );
      expect(makeUnsignedContractCall).toHaveBeenCalledWith(
        expect.not.objectContaining({ anchorMode: expect.anything() }),
      );
      expect(result).toBe(mockTx);
    });

    test("should create token transfer transaction without optional parameters", async () => {
      const contractAddress = "SP_CONTRACT";
      const contractName = "token-contract";
      const assetName = "TOKEN-X";
      const amount = new BigNumber(1000);
      const senderAddress = "SP_SENDER";
      const recipientAddress = "SP_RECIPIENT";
      const anchorMode = AnchorMode.Any;
      const network = "mainnet";
      const publicKey = "PUBLIC_KEY";

      const result = await createTokenTransferTransaction({
        contractAddress,
        contractName,
        assetName,
        amount,
        senderAddress,
        recipientAddress,
        anchorMode,
        network,
        publicKey,
      });

      void anchorMode;
      expect(makeUnsignedContractCall).toHaveBeenCalledWith(
        expect.objectContaining({
          contractAddress,
          contractName,
          functionName: "transfer",
          network,
          publicKey,
        }),
      );
      expect(makeUnsignedContractCall).toHaveBeenCalledWith(
        expect.not.objectContaining({
          fee: expect.anything(),
          nonce: expect.anything(),
          anchorMode: expect.anything(),
        }),
      );
      expect(result).toBe(mockTx);
    });
  });

  describe("createStxTransferTransaction", () => {
    const mockTx = { serialize: jest.fn() } as unknown as StacksTransactionWire;

    beforeEach(() => {
      (makeUnsignedSTXTokenTransfer as jest.Mock).mockResolvedValue(mockTx);
    });

    test("should create STX transfer transaction with all parameters", async () => {
      const amount = new BigNumber(1000);
      const recipientAddress = "SP_RECIPIENT";
      const anchorMode = AnchorMode.Any;
      const network = "mainnet";
      const publicKey = "PUBLIC_KEY";
      const fee = new BigNumber(100);
      const nonce = new BigNumber(5);
      const memo = "Test memo";

      const result = await createStxTransferTransaction(
        amount,
        recipientAddress,
        anchorMode,
        network,
        publicKey,
        {
          fee,
          nonce,
          memo,
        },
      );

      // anchorMode is accepted for call-site compatibility but no longer forwarded:
      // @stacks/transactions@7's UnsignedTokenTransferOptions dropped the field.
      void anchorMode;
      expect(makeUnsignedSTXTokenTransfer).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: "1000",
          recipient: recipientAddress,
          network,
          publicKey,
          fee: "100",
          nonce: "5",
          memo,
        }),
      );
      expect(makeUnsignedSTXTokenTransfer).toHaveBeenCalledWith(
        expect.not.objectContaining({ anchorMode: expect.anything() }),
      );
      expect(result).toBe(mockTx);
    });

    test("should create STX transfer transaction without optional parameters", async () => {
      const amount = new BigNumber(1000);
      const recipientAddress = "SP_RECIPIENT";
      const anchorMode = AnchorMode.Any;
      const network = "mainnet";
      const publicKey = "PUBLIC_KEY";

      const result = await createStxTransferTransaction(
        amount,
        recipientAddress,
        anchorMode,
        network,
        publicKey,
      );

      void anchorMode;
      expect(makeUnsignedSTXTokenTransfer).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: "1000",
          recipient: recipientAddress,
          network,
          publicKey,
        }),
      );
      expect(makeUnsignedSTXTokenTransfer).toHaveBeenCalledWith(
        expect.not.objectContaining({
          fee: expect.anything(),
          nonce: expect.anything(),
          anchorMode: expect.anything(),
        }),
      );
      expect(result).toBe(mockTx);
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

  describe("applySignatureToTransaction", () => {
    test("should apply signature to transaction and return serialized buffer", () => {
      // serialize() returns a hex string on @stacks/transactions@7 (StacksTransactionWire's real
      // return type), not the pre-v7 Uint8Array -- a stale Uint8Array mock here would hide a
      // wrong-encoding regression, since Buffer.from(uint8array, "hex") ignores the "hex" arg.
      const mockTx = {
        auth: {
          spendingCondition: {},
        },
        serialize: jest.fn().mockReturnValue("010203"),
      } as unknown as StacksTransactionWire;

      (createMessageSignature as jest.Mock).mockReturnValue("MOCK_SIGNATURE");

      const signature = "SIGNATURE_HEX";

      // Bypass TypeScript for test mocks
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const result = applySignatureToTransaction(mockTx, signature);

      expect(createMessageSignature).toHaveBeenCalledWith(signature);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(mockTx.auth.spendingCondition.signature).toBe("MOCK_SIGNATURE");
      expect(mockTx.serialize).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString("hex")).toBe("010203");
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
      (createMessageSignature as jest.Mock).mockReturnValue("MOCK_SIGNATURE");
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
      expect(createMessageSignature).toHaveBeenCalledWith(signature);
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
      expect(createMessageSignature).toHaveBeenCalledWith(signature);
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
