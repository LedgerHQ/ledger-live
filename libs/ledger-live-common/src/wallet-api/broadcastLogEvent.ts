import type { Transaction as WalletAPITransaction } from "@ledgerhq/wallet-api-core";
import type {
  Account,
  AccountLike,
  SignedOperation,
  TransactionSource,
} from "@ledgerhq/types-live";
import { getEnv } from "@ledgerhq/live-env";
import { getTxType } from "./utils/txTrackingHelper";

/**
 * Identifies which broadcast pathway emitted the log event.
 * This is the granular "where", complementing the live-app `manifestId`.
 */
export enum BroadcastFlow {
  /** Native in-app send flow (`useBroadcast`). */
  Send = "send",
  WalletApiSignAndBroadcast = "wallet-api/transaction.signAndBroadcast",
  WalletApiSignRaw = "wallet-api/transaction.signRaw",
  WalletApiSignPsbt = "wallet-api/bitcoin.signPsbt",
  Dapp = "dApp/eth_sendTransaction",
  Acre = "acre/transactionSignAndBroadcast",
  PlatformLegacy = "platform/broadcast",
}

/**
 * Normalized, countable broadcast error categories.
 *
 * Broadcast errors are a mix of Ledger custom errors (stable `error.name`) and
 * raw network/RPC errors (signal only in `error.message`). This enum lets
 * dashboards group failures reliably without parsing free-text messages.
 *
 * Keep this list small and grow it from real Datadog data — the size of the
 * `Unknown` bucket is itself a quality metric.
 */
export enum BroadcastErrorType {
  InsufficientFunds = "InsufficientFunds",
  InvalidTransaction = "InvalidTransaction",
  /** EVM NONCE_EXPIRED + Cosmos sequence mismatch. */
  NonceOrSequenceError = "NonceOrSequenceError",
  ReplacementUnderpriced = "ReplacementUnderpriced",
  TransactionUnderpriced = "TransactionUnderpriced",
  /** GasEstimationError + UNPREDICTABLE_GAS_LIMIT. */
  GasError = "GasError",
  /** Tron expiry + generic expiry. */
  TransactionExpired = "TransactionExpired",
  UnsupportedRpcMethod = "UnsupportedRpcMethod",
  /** Connectivity / timeout / fetch failures. */
  NetworkError = "NetworkError",
  /** Node responded with an uncategorized error. */
  RpcError = "RpcError",
  Unknown = "Unknown",
}

type CommonLogEvent = {
  appVersion: string;
  /** Which broadcast pathway emitted the event. */
  flow: BroadcastFlow;
  /** Live-app manifest id — the primary "where". Absent for the native send flow. */
  manifestId?: string;
  source?: TransactionSource;
  /** Parent/network currency id (e.g. "ethereum"); token id is reported separately. */
  currencyId: string;
  family: string;
  tokenId?: string;
  /** Family-specific transaction type/mode. Only populated when a rich transaction is available. */
  transactionType?: string;
  isTestnet: boolean;
  isSendMax: boolean;
};

type ErrorLogEvent = {
  status: "failure";
  error: Error;
  errorType: BroadcastErrorType;
  txPayload: {
    signature: string;
    rawData?: Record<string, unknown>;
  };
} & CommonLogEvent;

type SuccessLogEvent = { status: "success" } & CommonLogEvent;

export type LogEvent = SuccessLogEvent | ErrorLogEvent;

/** A function that consumes a broadcast {@link LogEvent}, injected by each app (e.g. to forward to Datadog). */
export type BroadcastLogger = (event: LogEvent) => void;

export function toError(err: unknown): Error {
  if (err instanceof Error) return err;
  if (typeof err === "string") return new Error(err);
  try {
    return new Error(JSON.stringify(err));
  } catch {
    return new Error(String(err));
  }
}

/**
 * Derives a family-specific transaction type from a wallet-api transaction.
 *
 * - EVM: the call-data function selector (e.g. "approve", "swap", "withdraw"), "transfer" as fallback.
 * - Families with an operation `mode`: the mode string (e.g. "delegate", "freeze", "bond").
 * - Solana: the model kind.
 * - Ton: the payload type.
 * - Families with no discriminator (e.g. bitcoin, stellar): "send".
 *
 * Returns `undefined` when no rich transaction is available (signRaw / signPsbt / ACRE / legacy platform).
 */
export function getBroadcastTransactionType(
  tx: WalletAPITransaction | undefined | null,
): string | undefined {
  if (!tx) return undefined;

  switch (tx.family) {
    case "ethereum":
      // getTxType only reads `tx.data` (a Buffer), which the wallet-api ethereum tx also carries.
      return getTxType(tx as unknown as Parameters<typeof getTxType>[0]);
    case "solana":
      return tx.model?.kind;
    case "ton":
      return tx.payload?.type ?? "send";
    case "bitcoin":
    case "stellar":
      return "send";
    default:
      // Most remaining families (cosmos, tron, polkadot, cardano, algorand, near, …) expose a `mode`.
      return (tx as { mode?: string }).mode;
  }
}

/**
 * Maps an arbitrary broadcast error to a normalized {@link BroadcastErrorType}.
 *
 * Pure string-matching (no coin-module imports): matches stable `error.name`
 * first, then falls back to stable RPC code substrings in `error.message`.
 */
export function categorizeBroadcastError(error: Error): BroadcastErrorType {
  const name = error.name ?? "";
  const message = (error.message ?? "").toUpperCase();

  // 1. Stable Ledger custom error names.
  switch (name) {
    case "InsufficientFunds":
      return BroadcastErrorType.InsufficientFunds;
    case "InvalidTransactionError":
      return BroadcastErrorType.InvalidTransaction;
    case "SequenceNumberError":
      return BroadcastErrorType.NonceOrSequenceError;
    case "GasEstimationError":
      return BroadcastErrorType.GasError;
    case "TronTransactionExpired":
      return BroadcastErrorType.TransactionExpired;
    case "UnsupportedRpcMethodError":
      return BroadcastErrorType.UnsupportedRpcMethod;
    case "NetworkError":
    case "NetworkDown":
      return BroadcastErrorType.NetworkError;
    case "SendTransactionError":
      return BroadcastErrorType.RpcError;
  }

  // 2. Stable RPC code substrings (ethers.js error codes are not localized).
  if (message.includes("INSUFFICIENT_FUNDS")) return BroadcastErrorType.InsufficientFunds;
  if (message.includes("NONCE_EXPIRED") || message.includes("NONCE TOO LOW"))
    return BroadcastErrorType.NonceOrSequenceError;
  if (message.includes("REPLACEMENT_UNDERPRICED")) return BroadcastErrorType.ReplacementUnderpriced;
  if (message.includes("TRANSACTION_UNDERPRICED")) return BroadcastErrorType.TransactionUnderpriced;
  if (message.includes("UNPREDICTABLE_GAS_LIMIT")) return BroadcastErrorType.GasError;

  return BroadcastErrorType.Unknown;
}

export type BuildBroadcastCommonEventParams = {
  /** The signing account (used to read the token id). */
  account: AccountLike;
  /** The resolved main account (used to read currency/family/testnet). */
  mainAccount: Account;
  flow: BroadcastFlow;
  manifestId?: string;
  source?: TransactionSource;
  transactionType?: string;
  isSendMax?: boolean;
};

/** Builds the shared part of a broadcast log event. */
export function buildBroadcastCommonEvent({
  account,
  mainAccount,
  flow,
  manifestId,
  source,
  transactionType,
  isSendMax = false,
}: BuildBroadcastCommonEventParams): CommonLogEvent {
  return {
    appVersion: getEnv("LEDGER_CLIENT_VERSION"),
    flow,
    currencyId: mainAccount.currency.id,
    family: mainAccount.currency.family,
    isTestnet: Boolean(mainAccount.currency.isTestnetFor),
    isSendMax,
    ...(manifestId ? { manifestId } : {}),
    ...(source ? { source } : {}),
    ...(transactionType ? { transactionType } : {}),
    ...(account.type === "TokenAccount" ? { tokenId: account.token.id } : {}),
  };
}

export function buildBroadcastSuccessEvent(common: CommonLogEvent): SuccessLogEvent {
  return { status: "success", ...common };
}

export function buildBroadcastFailureEvent(
  common: CommonLogEvent,
  err: unknown,
  signedOperation: SignedOperation,
): ErrorLogEvent {
  const error = toError(err);
  return {
    status: "failure",
    error,
    errorType: categorizeBroadcastError(error),
    txPayload: {
      signature: signedOperation.signature,
      ...(signedOperation.rawData ? { rawData: signedOperation.rawData } : {}),
    },
    ...common,
  };
}
