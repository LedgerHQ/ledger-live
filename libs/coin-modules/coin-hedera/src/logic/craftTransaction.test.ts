import invariant from "invariant";
import * as sdk from "@hashgraph/sdk";
import type { FeeEstimation, TransactionIntent } from "@ledgerhq/coin-framework/api/index";
import { HEDERA_TRANSACTION_MODES, TINYBAR_SCALE } from "../constants";
import { craftTransaction } from "./craftTransaction";
import type { HederaMemo } from "../types";
import { serializeTransaction } from "./utils";

jest.mock("./utils");

describe("craftTransaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (serializeTransaction as jest.Mock).mockReturnValue("serialized-transaction");
  });

  it("should craft a native HBAR transfer transaction", async () => {
    const txIntent = {
      intentType: "transaction",
      type: HEDERA_TRANSACTION_MODES.Send,
      amount: BigInt(1 * 10 ** TINYBAR_SCALE),
      recipient: "0.0.12345",
      sender: "0.0.54321",
      asset: {
        type: "native",
      },
      memo: {
        kind: "text",
        type: "string",
        value: "Hbar transfer",
      },
    } satisfies TransactionIntent<HederaMemo>;

    const result = await craftTransaction(txIntent);

    expect(result.tx).toBeInstanceOf(sdk.TransferTransaction);
    invariant(result.tx instanceof sdk.TransferTransaction, "TransferTransaction type guard");

    const senderTransfer = result.tx.hbarTransfers?.get(txIntent.sender);
    const recipientTransfer = result.tx.hbarTransfers?.get(txIntent.recipient);

    expect(senderTransfer).toEqual(sdk.Hbar.fromTinybars(-txIntent.amount));
    expect(recipientTransfer).toEqual(sdk.Hbar.fromTinybars(txIntent.amount));
    expect(result.tx.transactionMemo).toBe(txIntent.memo.value);
    expect(serializeTransaction).toHaveBeenCalled();
    expect(result).toEqual({
      tx: expect.any(Object),
      serializedTx: "serialized-transaction",
    });
  });

  it("should craft a token transfer transaction", async () => {
    const txIntent = {
      intentType: "transaction",
      type: HEDERA_TRANSACTION_MODES.Send,
      amount: BigInt(1000),
      recipient: "0.0.12345",
      sender: "0.0.54321",
      asset: {
        type: "hts",
        assetReference: "0.0.7890",
      },
      memo: {
        kind: "text",
        type: "string",
        value: "Token transfer",
      },
    } satisfies TransactionIntent<HederaMemo>;

    const result = await craftTransaction(txIntent);

    expect(result.tx).toBeInstanceOf(sdk.TransferTransaction);
    invariant(result.tx instanceof sdk.TransferTransaction, "TransferTransaction type guard");

    const tokenTransfers = result.tx.tokenTransfers.get(txIntent.asset.assetReference);
    const senderTransfer = tokenTransfers?.get(txIntent.sender);
    const recipientTransfer = tokenTransfers?.get(txIntent.recipient);

    // .toString() is used because tokenTransfers values are Long objects
    // this is internal dependency of @hashgraph/sdk, re-exported in newer version
    expect(senderTransfer?.toString()).toEqual((-txIntent.amount).toString());
    expect(recipientTransfer?.toString()).toEqual(txIntent.amount.toString());
    expect(result.tx.transactionMemo).toBe("Token transfer");
    expect(serializeTransaction).toHaveBeenCalled();
    expect(result).toEqual({
      tx: expect.any(Object),
      serializedTx: "serialized-transaction",
    });
  });

  it("should craft a token associate transaction", async () => {
    const txIntent = {
      intentType: "transaction",
      type: HEDERA_TRANSACTION_MODES.TokenAssociate,
      amount: BigInt(0),
      recipient: "",
      sender: "0.0.54321",
      asset: {
        type: "hts",
        assetReference: "0.0.7890",
      },
      memo: {
        kind: "text",
        type: "string",
        value: "Token association",
      },
    } satisfies TransactionIntent<HederaMemo>;

    const result = await craftTransaction(txIntent);

    expect(result.tx).toBeInstanceOf(sdk.TokenAssociateTransaction);
    invariant(
      result.tx instanceof sdk.TokenAssociateTransaction,
      "TokenAssociateTransaction type guard",
    );

    expect(result.tx.accountId).toEqual(sdk.AccountId.fromString(txIntent.sender));
    expect(result.tx.tokenIds).toEqual([sdk.TokenId.fromString(txIntent.asset.assetReference)]);
    expect(result.tx.transactionMemo).toBe("Token association");
    expect(serializeTransaction).toHaveBeenCalled();
    expect(result).toEqual({
      tx: expect.any(Object),
      serializedTx: "serialized-transaction",
    });
  });

  it("should apply custom fees when provided", async () => {
    const customFees: FeeEstimation = {
      value: BigInt(50000),
    };

    const result = await craftTransaction(
      {
        intentType: "transaction",
        type: HEDERA_TRANSACTION_MODES.Send,
        amount: BigInt(1000000),
        recipient: "0.0.12345",
        sender: "0.0.54321",
        asset: {
          type: "native",
        },
        memo: {
          kind: "text",
          type: "string",
          value: "Test memo with custom fee",
        },
      },
      customFees,
    );

    expect(result.tx).toBeInstanceOf(sdk.TransferTransaction);
    invariant(result.tx instanceof sdk.TransferTransaction, "TransferTransaction type guard");
    expect(result.tx.maxTransactionFee).toEqual(sdk.Hbar.fromTinybars(customFees.value));
  });

  it("should throw error when token associate transaction has invalid asset type", async () => {
    const txIntent = {
      intentType: "transaction",
      type: HEDERA_TRANSACTION_MODES.TokenAssociate,
      amount: BigInt(0),
      recipient: "",
      sender: "0.0.54321",
      asset: {
        type: "native",
      },
      memo: {
        kind: "text",
        type: "string",
        value: "Invalid token association",
      },
    } satisfies TransactionIntent<HederaMemo>;

    await expect(craftTransaction(txIntent)).rejects.toThrow();
  });

  it("should throw error when token associate transaction has missing assetReference", async () => {
    const txIntent = {
      intentType: "transaction",
      type: HEDERA_TRANSACTION_MODES.TokenAssociate,
      amount: BigInt(0),
      recipient: "",
      sender: "0.0.54321",
      asset: {
        type: "hts",
      },
      memo: {
        kind: "text",
        type: "string",
        value: "Missing asset reference",
      },
    } satisfies TransactionIntent<HederaMemo>;

    await expect(craftTransaction(txIntent)).rejects.toThrow();
  });

  it("should throw error when token transfer transaction has missing assetReference", async () => {
    const txIntent = {
      intentType: "transaction",
      type: HEDERA_TRANSACTION_MODES.Send,
      amount: BigInt(1000),
      recipient: "0.0.12345",
      sender: "0.0.54321",
      asset: {
        type: "hts",
      },
      memo: {
        kind: "text",
        type: "string",
        value: "Missing token reference",
      },
    } satisfies TransactionIntent<HederaMemo>;

    await expect(craftTransaction(txIntent)).rejects.toThrow();
  });
});
