import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import {
  CoinModuleApi,
  BalanceOptions,
  CraftedTransaction,
  Cursor,
  FeeEstimation,
  ListOperationsOptions,
  Operation,
  Page,
  Reward,
  Stake,
  TransactionIntent,
  Validator,
} from "@ledgerhq/coin-module-framework/api/index";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import { xdr } from "@stellar/stellar-sdk";
import coinConfig, { type StellarConfig } from "../config";
import {
  broadcast,
  combine,
  craftTransaction,
  estimateFees,
  getBalance,
  getBlock,
  getBlockInfo,
  lastBlock,
  validateIntent,
} from "../logic";
import { operationsFromHeight } from "../logic/operationsFromHeight";
import { validateAddress } from "../logic/validateAddress";
import { fetchSequence, registerHorizonInterceptors } from "../network";
import { StellarMemo } from "../types";

export function createApi(config: StellarConfig): CoinModuleApi<StellarMemo> {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));
  registerHorizonInterceptors();

  return {
    broadcast,
    combine: compose,
    craftTransaction: craft,
    craftRawTransaction: (
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ): Promise<CraftedTransaction> => {
      throw new Error("craftRawTransaction is not supported");
    },
    estimateFees: estimate,
    getBalance: (address: string, options?: BalanceOptions) =>
      rejectBalanceOptions(() => getBalance(address), options),
    lastBlock,
    listOperations: operations,
    getBlock,
    getBlockInfo,
    getStakes(_address: string, _cursor?: Cursor): Promise<Page<Stake>> {
      throw new Error("getStakes is not supported");
    },
    getRewards(_address: string, _cursor?: Cursor): Promise<Page<Reward>> {
      throw new Error("getRewards is not supported");
    },
    validateIntent,
    getNextSequence: async (address: string) => {
      const sequence = await fetchSequence(address);
      return BigInt(sequence.plus(1).toFixed());
    },
    getValidators(_cursor?: Cursor): Promise<Page<Validator>> {
      throw new Error("getValidators is not supported");
    },
    validateAddress,
    craftTransactionData,
  };
}

async function craft(
  transactionIntent: TransactionIntent<StellarMemo>,
  customFees?: FeeEstimation,
): Promise<CraftedTransaction> {
  const fees = customFees?.value || (await estimateFees());

  // NOTE: check how many memos, throw if more than one?
  // if (transactionIntent.memos && transactionIntent.memos.length > 1) {
  //   throw new Error("Stellar only supports one memo per transaction.");
  // }
  const memo = "memo" in transactionIntent ? transactionIntent.memo : undefined;
  const hasMemoValue = memo && memo.type !== "NO_MEMO";
  const tx = await craftTransaction(
    { address: transactionIntent.sender },
    {
      type: transactionIntent.type,
      recipient: transactionIntent.recipient,
      amount: transactionIntent.amount,
      fee: fees,
      ...(transactionIntent.asset.type !== "native" && "assetReference" in transactionIntent.asset
        ? {
            assetCode: transactionIntent.asset.assetReference,
            assetIssuer: transactionIntent.asset.assetOwner,
          }
        : {}),
      memoType: memo?.type,
      ...(hasMemoValue ? { memoValue: (memo as { value: string }).value } : {}),
    },
  );

  // Note: the API returns the signature base, not the full XDR, see BACK-8727 for more context
  return { transaction: tx.signatureBase };
}

function compose(tx: string, signature: string, pubkey?: string): string {
  if (!pubkey) {
    throw new Error("Missing pubkey");
  }
  // note: accept here `TransactionEnvelope` or `TransactionSignaturePayload`, see BACK-8727 for more context
  return combine(envelopeFromAnyXDR(tx, "base64"), signature, pubkey);
}

async function estimate(_transactionIntent: TransactionIntent): Promise<FeeEstimation> {
  const value = await estimateFees();
  return { value };
}

async function operations(
  address: string,
  { minHeight }: ListOperationsOptions,
): Promise<Page<Operation>> {
  const { items, next } = await operationsFromHeight(address, minHeight);
  return { items, next: next || undefined };
}

/**
 * Deserialize a transaction envelope, also accepting transaction signature payload form.
 *
 * @param input serialized `TransactionEnvelope` or `TransactionSignaturePayload`
 * @param format serialization encoding
 */
export function envelopeFromAnyXDR(
  input: string,
  format: "hex" | "base64",
): xdr.TransactionEnvelope {
  try {
    return xdr.TransactionEnvelope.fromXDR(input, format);
  } catch (envelopeError) {
    try {
      return signatureBaseToEnvelope(xdr.TransactionSignaturePayload.fromXDR(input, format));
    } catch (signatureBaseError) {
      throw new Error(
        `Failed decoding transaction as an envelope (${envelopeError}) or as a signature base: (${signatureBaseError})`,
      );
    }
  }
}

/**
 * Convert a `TransactionSignaturePayload` into a `TransactionEnvelope`.
 *
 * @param signatureBase deserialized `TransactionSignaturePayload`
 */
function signatureBaseToEnvelope(
  signatureBase: xdr.TransactionSignaturePayload,
): xdr.TransactionEnvelope {
  const tx = signatureBase.taggedTransaction().value();
  if (tx instanceof xdr.Transaction) {
    return xdr.TransactionEnvelope.envelopeTypeTx(
      new xdr.TransactionV1Envelope({ tx, signatures: [] }),
    );
  } else {
    return xdr.TransactionEnvelope.envelopeTypeTxFeeBump(
      new xdr.FeeBumpTransactionEnvelope({ tx, signatures: [] }),
    );
  }
}
