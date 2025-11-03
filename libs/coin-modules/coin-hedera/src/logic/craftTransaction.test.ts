import invariant from "invariant";
import * as sdk from "@hashgraph/sdk";
import type { FeeEstimation, TransactionIntent } from "@ledgerhq/coin-framework/api/index";
import { HEDERA_TRANSACTION_MODES, TINYBAR_SCALE } from "../constants";
import { craftTransaction } from "./craftTransaction";
import type { HederaMemo, HederaTxData } from "../types";
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

    expect(senderTransfer).toEqual(sdk.Hbar.fromTinybars((-txIntent.amount).toString()));
    expect(recipientTransfer).toEqual(sdk.Hbar.fromTinybars(txIntent.amount.toString()));
    expect(result.tx.transactionMemo).toBe(txIntent.memo.value);
    expect(serializeTransaction).toHaveBeenCalled();
    expect(result).toEqual({
      tx: expect.any(Object),
      serializedTx: "serialized-transaction",
    });
  });

  it("should craft HTS token transfer transaction", async () => {
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

    expect(senderTransfer).toEqual(sdk.Long.fromBigInt(-txIntent.amount));
    expect(recipientTransfer).toEqual(sdk.Long.fromBigInt(txIntent.amount));
    expect(result.tx.transactionMemo).toBe("Token transfer");
    expect(serializeTransaction).toHaveBeenCalled();
    expect(result).toEqual({
      tx: expect.any(Object),
      serializedTx: "serialized-transaction",
    });
  });

  it("should craft ERC20 token transfer transaction", async () => {
    const txIntent = {
      intentType: "transaction",
      type: HEDERA_TRANSACTION_MODES.Send,
      amount: BigInt(1000),
      recipient: "0.0.12345",
      sender: "0.0.54321",
      asset: {
        type: "erc20",
        assetReference: "0x39ceba2b467fa987546000eb5d1373acf1f3a2e1",
      },
      memo: {
        kind: "text",
        type: "string",
        value: "Token transfer",
      },
      data: {
        type: "erc20",
        gasLimit: BigInt(100000),
      },
    } satisfies TransactionIntent<HederaMemo, HederaTxData>;

    const result = await craftTransaction(txIntent);

    expect(result.tx).toBeInstanceOf(sdk.ContractExecuteTransaction);
    invariant(
      result.tx instanceof sdk.ContractExecuteTransaction,
      "ContractExecuteTransaction type guard",
    );

    expect(result.tx.gas).toEqual(sdk.Long.fromBigInt(txIntent.data.gasLimit));
    expect(result.tx.contractId).toEqual(
      sdk.ContractId.fromEvmAddress(0, 0, txIntent.asset.assetReference),
    );
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
    expect(result.tx.maxTransactionFee).toEqual(sdk.Hbar.fromTinybars(customFees.value.toString()));
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
