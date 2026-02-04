import {
  Api,
  Block,
  BlockInfo,
  Cursor,
  ListOperationsOptions,
  Page,
  Validator,
  FeeEstimation,
  Operation,
  Stake,
  Reward,
  TransactionIntent,
  CraftedTransaction,
} from "@ledgerhq/coin-framework/api/index";
import { LedgerAPI4xx } from "@ledgerhq/errors";
import { getEnv } from "@ledgerhq/live-env";
import { log } from "@ledgerhq/logs";
import { xdr } from "@stellar/stellar-sdk";
import coinConfig, { type StellarConfig } from "../config";
import {
  broadcast,
  combine,
  craftTransaction,
  estimateFees,
  getBalance,
  validateIntent,
  lastBlock,
  listOperations,
  STELLAR_BURN_ADDRESS,
  getTokenFromAsset,
  getAssetFromToken,
} from "../logic";
import { fetchSequence } from "../network";
import { StellarBurnAddressError, StellarMemo } from "../types";

export function createApi(config: StellarConfig): Api<StellarMemo> {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));

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
    getBalance,
    lastBlock,
    listOperations: operations,
    getBlock(_height): Promise<Block> {
      throw new Error("getBlock is not supported");
    },
    getBlockInfo(_height: number): Promise<BlockInfo> {
      throw new Error("getBlockInfo is not supported");
    },
    getStakes(_address: string, _cursor?: Cursor): Promise<Page<Stake>> {
      throw new Error("getStakes is not supported");
    },
    getRewards(_address: string, _cursor?: Cursor): Promise<Page<Reward>> {
      throw new Error("getRewards is not supported");
    },
    validateIntent,
    getSequence: async (address: string) => {
      const sequence = await fetchSequence(address);
      // NOTE: might not do plus one here, or if we do, rename to getNextValidSequence
      return BigInt(sequence.plus(1).toFixed());
    },
    getTokenFromAsset,
    getAssetFromToken,
    getChainSpecificRules: () => ({
      getAccountShape: (address: string) => {
        // NOTE: https://github.com/LedgerHQ/ledger-live/pull/2058
        if (address === STELLAR_BURN_ADDRESS) {
          throw new StellarBurnAddressError();
        }
      },
      getTransactionStatus: {
        throwIfPendingOperation: true,
      },
    }),
    getValidators(_cursor?: Cursor): Promise<Page<Validator>> {
      throw new Error("getValidators is not supported");
    },
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
  { minHeight, cursor }: ListOperationsOptions,
): Promise<Page<Operation>> {
  if (minHeight) {
    const [items, next] = await operationsFromHeight(address, minHeight);
    return { items, next: next || undefined };
  }
  const isInitSync = !cursor || cursor === "";
  // FIXME: why bother creating limit and pagingToken here, something is off?!
  const newPagination = isInitSync
    ? { limit: getEnv("API_STELLAR_HORIZON_INITIAL_FETCH_MAX_OPERATIONS"), minHeight: 0 }
    : { pagingToken: cursor, minHeight: 0 };
  const [items, next] = await operationsFromHeight(address, newPagination.minHeight);
  return { items, next: next || undefined };
}

type PaginationState = {
  readonly pageSize: number;
  readonly heightLimit: number;
  continueIterations: boolean;
  apiNextCursor?: string;
  accumulator: Operation[];
};

async function operationsFromHeight(
  address: string,
  minHeight: number,
): Promise<[Operation[], string]> {
  const state: PaginationState = {
    pageSize: 200,
    heightLimit: minHeight,
    continueIterations: true,
    accumulator: [],
  };

  // unfortunately, the stellar API does not support an option to filter by min height
  // so the only strategy to get ALL operations is to iterate over all of them in descending order
  // until we reach the desired minHeight
  while (state.continueIterations) {
    const options: ListOperationsOptions = { limit: state.pageSize, order: "desc", minHeight };
    if (state.apiNextCursor) {
      options.cursor = state.apiNextCursor;
    }
    try {
      const [operations, nextCursor] = await listOperations(address, options);
      state.accumulator.push(...operations);
      state.apiNextCursor = nextCursor;
      state.continueIterations = nextCursor !== "";
    } catch (e: unknown) {
      if (e instanceof LedgerAPI4xx && (e as unknown as { status: number }).status === 429) {
        log("coin:stellar", "(api/operations): TooManyRequests, retrying in 4s");
        await new Promise(resolve => setTimeout(resolve, 4000));
      } else {
        throw e;
      }
    }
  }

  return [state.accumulator, state.apiNextCursor ? state.apiNextCursor : ""];
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
