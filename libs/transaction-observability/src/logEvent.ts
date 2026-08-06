import type { Transaction as WalletAPITransaction } from "@ledgerhq/wallet-api-core";
import type {
  Account,
  AccountLike,
  SignedOperation,
  TransactionSource,
} from "@ledgerhq/types-live";
// @shared/env (not @ledgerhq/live-env) so the env definitions are guaranteed injected.
import { getEnv } from "@shared/env";
import { DAPP_SELECTORS } from "@ledgerhq/evm-tools/selectors/index";
import { deriveEarnTransactionType, type EarnTransactionType } from "./earnTransactionType";

/**
 * Identifies which pathway emitted the transaction log event.
 * This is the granular "where", complementing the live-app `manifestId`.
 */
export enum TransactionFlow {
  /** Native in-app send flow (`useBroadcast`). */
  Send = "send",
  WalletApiSignAndBroadcast = "wallet-api/transaction.signAndBroadcast",
  WalletApiSignRaw = "wallet-api/transaction.signRaw",
  WalletApiSignPsbt = "wallet-api/bitcoin.signPsbt",
  Dapp = "dApp/eth_sendTransaction",
  Acre = "acre/transactionSignAndBroadcast",
  PlatformLegacy = "platform/broadcast",
  /** Emitted by the bridge seam when the originating route is not known (e.g. sign-stage). */
  Unknown = "unknown",
}

/** Which stage of the transaction lifecycle produced the event. */
export enum TransactionStage {
  Sign = "sign",
  Broadcast = "broadcast",
}

/**
 * Normalized, countable error categories spanning the whole sign+broadcast lifecycle.
 *
 * Shared taxonomy with the Earn live app's classifier (LIVE-34203). LL can only
 * classify the categories it observes (device / user / gas / blockchain);
 * `validation`, `partner`, `geolocation` originate in the app and are classified
 * app-side using the same string values.
 */
export enum ErrorCategory {
  DeviceDisconnected = "device_disconnected",
  DeviceWrongAccount = "device_wrong_account",
  UserModalDismissed = "user_modal_dismissed",
  UserDeviceRefused = "user_device_refused",
  GasInsufficientBalance = "gas_insufficient_balance",
  GasFeeTooLow = "gas_fee_too_low",
  Geolocation = "geolocation",
  Partner = "partner",
  Blockchain = "blockchain",
  /** Pre-sign checks (mostly app-side). */
  Validation = "validation",
  Unknown = "unknown",
}

type CommonLogEvent = {
  appVersion: string;
  /** Which pathway emitted the event. */
  flow: TransactionFlow;
  /** Live-app manifest id — the primary "where". Absent for the native send flow. */
  manifestId?: string;
  source?: TransactionSource;
  /** Parent/network currency id (e.g. "ethereum"); token id is reported separately. */
  currencyId: string;
  family: string;
  tokenId?: string;
  /** Tickers, so analytics can report the asset the user recognises ("ETH", "USDC"). */
  currencyTicker: string;
  tokenTicker?: string;
  /**
   * Normalized action (delegate / undelegate / deposit / redeem / …), derived per family.
   * Distinct from `flow` (the technical origin/pathway). Undefined when the transaction is
   * not a recognised staking/vault action — e.g. a plain send or a swap.
   */
  earnTransactionType?: EarnTransactionType;
  /**
   * The family-specific value `earnTransactionType` was derived from — a family `mode`,
   * Solana `model.kind`, TON `payload.type`, or an EVM selector name. Kept for
   * drill-down and to measure how often the normalization misses.
   */
  rawTransactionType?: string;
  /**
   * Delegation target(s) — validator addresses / staking pool id(s) — read from the transaction.
   * Only available at the sign stage (the transaction is not passed to broadcast). Public ids,
   * not the human pool name/ticker (that is account-state enrichment, not on the transaction).
   */
  validators?: string[];
  isTestnet: boolean;
  isSendMax: boolean;
};

type FailureLogEvent = {
  status: "failure";
  /** Lifecycle stage that failed. */
  stage: TransactionStage;
  error: Error;
  errorCategory: ErrorCategory;
  /** Present only when signing succeeded (i.e. broadcast-stage failures). */
  txPayload?: {
    signature: string;
    rawData?: Record<string, unknown>;
  };
} & CommonLogEvent;

type SuccessLogEvent = {
  status: "success";
  stage: TransactionStage.Broadcast;
} & CommonLogEvent;

/** A transaction attempt reached a lifecycle stage (funnel top, e.g. the device sign prompt). */
type StartedLogEvent = {
  status: "started";
  stage: TransactionStage;
} & CommonLogEvent;

export type LogEvent = SuccessLogEvent | FailureLogEvent | StartedLogEvent;

/** A function that consumes a transaction {@link LogEvent}, injected by each host app (e.g. to forward to Datadog). */
export type TransactionLogger = (event: LogEvent) => void;

const namedError = (name: string, message = ""): Error =>
  Object.assign(new Error(message), { name });

/**
 * Unwrap an RPC failure envelope so the real cause is what gets classified and reported.
 *
 * Neither the Wallet API's `RpcError`/`ServerError` nor Ledger Wallet's own dApp-path
 * `RpcError` sets `name` — it stays the default "Error" — and the cause sits behind
 * accessors, so the envelope on its own always classifies as unknown. Device and coin
 * errors skip this: the RPC layer round-trips those through `@ledgerhq/errors`, so
 * their `name` survives.
 */
export function unwrapRpcError(error: unknown): unknown {
  if (!error || typeof error !== "object") return error;

  // Ledger Wallet's EIP-1193 provider error (dApp path): code + reason, no name.
  const provider = error as { isRpcError?: unknown; code?: unknown; reason?: unknown };
  if (provider.isRpcError === true) {
    const message = typeof provider.reason === "string" ? provider.reason : "";
    // EIP-1193: 4001 is the user declining the request.
    return provider.code === 4001
      ? namedError("UserRejectedRequest", message)
      : namedError(`rpc_${String(provider.code)}`, message);
  }

  // Wallet API envelopes: the cause is behind getData() / getCode().
  const envelope = error as { getData?: () => unknown; getCode?: () => unknown };
  if (typeof envelope.getData !== "function") return error;

  const data = envelope.getData();
  if (data && typeof data === "object") {
    // A serialised error forwarded verbatim keeps its name; prefer it.
    const nested = ((data as { data?: unknown }).data ?? data) as {
      name?: unknown;
      message?: unknown;
      statusCode?: unknown;
    };
    if (typeof nested.name === "string") {
      const unwrapped = namedError(
        nested.name,
        typeof nested.message === "string" ? nested.message : "",
      );
      return typeof nested.statusCode === "number"
        ? Object.assign(unwrapped, { statusCode: nested.statusCode })
        : unwrapped;
    }

    const { code, message } = data as { code?: unknown; message?: unknown };
    if (typeof code === "string") {
      return namedError(code, typeof message === "string" ? message : "");
    }
  }

  const code = envelope.getCode?.();
  return code === undefined ? error : namedError(`rpc_${String(code)}`);
}

export function toError(err: unknown): Error {
  if (err instanceof Error) return err;
  if (typeof err === "string") return new Error(err);
  try {
    return new Error(JSON.stringify(err));
  } catch {
    return new Error(String(err));
  }
}

// EVM call-data function selector → solidity function name (e.g. "approve", "deposit").
// Reimplemented here (was ledger-live-common's `getTxType`) so this package stays free of a
// ledger-live-common dependency; it only reads `tx.data` (a Buffer), which the wallet-api
// ethereum transaction also carries.
//
// No call data means the transaction really is a plain transfer; call data we have no
// selector for is reported as "unknown" so the selector-map miss rate stays measurable.
function evmTxType(tx: { data?: { length: number; toString(encoding: "hex"): string } | null }) {
  if (!tx?.data?.length) return "transfer";
  const selector = `0x${tx.data.toString("hex").substring(0, 8)}`;
  return DAPP_SELECTORS[selector] ?? "unknown";
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
export function getRawTransactionType(
  tx: WalletAPITransaction | undefined | null,
): string | undefined {
  if (!tx) return undefined;

  switch (tx.family) {
    case "ethereum":
      return evmTxType(
        tx as unknown as { data?: { length: number; toString(encoding: "hex"): string } | null },
      );
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

function nonEmptyStrings(list?: (string | undefined | null)[]): string[] | undefined {
  const filtered = (list ?? []).filter((a): a is string => Boolean(a));
  return filtered.length ? filtered : undefined;
}

/**
 * Extracts the delegation target(s) (validator address(es) / staking pool id) from a transaction,
 * per family. Available at the sign stage only (the transaction is not passed to broadcast, and
 * for several families incl. Cardano the target is absent from `operation.extra`).
 *
 * Only families with an unambiguous, dedicated target field are handled. Families that overload
 * the generic `recipient` (near, tezos, multiversx, celo) are intentionally skipped to avoid
 * capturing plain send payees.
 */
export function getStakeTarget(tx: WalletAPITransaction | undefined | null): string[] | undefined {
  if (!tx) return undefined;
  const t = tx as unknown as {
    poolId?: string;
    validators?: Array<{ address?: string } | string>;
    votes?: Array<{ address?: string }>;
    stakingNodeId?: number | null;
    model?: { uiState?: { voteAccAddr?: string; delegate?: { voteAccAddress?: string } } };
  };
  switch (tx.family) {
    case "cardano":
      return t.poolId ? [t.poolId] : undefined;
    case "cosmos":
      return nonEmptyStrings(t.validators?.map(v => (typeof v === "string" ? v : v?.address)));
    case "polkadot":
      return nonEmptyStrings(t.validators as (string | undefined)[] | undefined);
    case "tron":
      return nonEmptyStrings(t.votes?.map(v => v?.address));
    case "hedera":
      return t.stakingNodeId != null ? [String(t.stakingNodeId)] : undefined;
    case "solana": {
      const addr = t.model?.uiState?.voteAccAddr ?? t.model?.uiState?.delegate?.voteAccAddress;
      return addr ? [addr] : undefined;
    }
    default:
      return undefined;
  }
}

/**
 * Maps an arbitrary sign/broadcast error to a normalized {@link ErrorCategory}.
 *
 * Pure string-matching (no coin-module imports): matches stable error `name`s
 * first (Ledger custom errors + device/transport errors), then falls back to
 * stable substrings in `error.message`. Covers what LL can observe across the
 * sign and broadcast stages; app-only categories (`validation`, `partner`,
 * `geolocation`) fall through to `Unknown` here and are classified app-side.
 */
export function classifyTransactionError(error: Error): ErrorCategory {
  const name = error.name ?? "";
  const message = (error.message ?? "").toUpperCase();

  // 1. Stable error names.
  switch (name) {
    case "WrongDeviceForAccount":
      return ErrorCategory.DeviceWrongAccount;
    case "UserRefusedOnDevice":
    case "UserRefusedAllowManager":
    case "TransactionRefusedOnDevice":
      return ErrorCategory.UserDeviceRefused;
    // EIP-1193 4001, unwrapped from a dApp provider error: declined in the UI, not on
    // the device.
    case "UserRejectedRequest":
      return ErrorCategory.UserModalDismissed;
    case "InsufficientFunds":
    case "NotEnoughBalance":
      return ErrorCategory.GasInsufficientBalance;
    case "InvalidTransactionError":
    case "GasEstimationError":
    case "SequenceNumberError":
    case "TronTransactionExpired":
    case "UnsupportedRpcMethodError":
    case "NetworkError":
    case "NetworkDown":
    case "SendTransactionError":
      return ErrorCategory.Blockchain;
  }
  // Device/transport status errors: the status code distinguishes a user decline
  // (CONDITIONS_OF_USE_NOT_SATISFIED / 0x6985, 0x5501) from other device faults.
  if (name === "DeviceStatusError" || name === "TransportStatusError") {
    const statusCode = (error as { statusCode?: number }).statusCode;
    if (statusCode === 0x6985 || statusCode === 0x5501) return ErrorCategory.UserDeviceRefused;
    return ErrorCategory.DeviceDisconnected;
  }
  if (
    name.startsWith("DisconnectedDevice") ||
    name === "CantOpenDevice" ||
    name === "TransportError" ||
    name === "TransportRaceCondition"
  ) {
    return ErrorCategory.DeviceDisconnected;
  }

  // 2. Stable message substrings.
  if (message.includes("SIGNATURE INTERRUPTED BY USER") || message.includes("CANCELED BY USER"))
    return ErrorCategory.UserModalDismissed;
  if (message.includes("INSUFFICIENT_FUNDS")) return ErrorCategory.GasInsufficientBalance;
  if (message.includes("REPLACEMENT_UNDERPRICED") || message.includes("TRANSACTION_UNDERPRICED"))
    return ErrorCategory.GasFeeTooLow;
  if (
    message.includes("NONCE_EXPIRED") ||
    message.includes("NONCE TOO LOW") ||
    message.includes("UNPREDICTABLE_GAS_LIMIT")
  )
    return ErrorCategory.Blockchain;

  return ErrorCategory.Unknown;
}

export type BuildTransactionCommonEventParams = {
  /** The signing account (used to read the token id). */
  account: AccountLike;
  /** The resolved main account (used to read currency/family/testnet). */
  mainAccount: Account;
  flow: TransactionFlow;
  manifestId?: string;
  source?: TransactionSource;
  /** Family-specific action; normalized into `earnTransactionType` on the event. */
  rawTransactionType?: string;
  validators?: string[];
  isSendMax?: boolean;
};

/** Builds the shared part of a transaction log event. */
export function buildTransactionCommonEvent({
  account,
  mainAccount,
  flow,
  manifestId,
  source,
  rawTransactionType,
  validators,
  isSendMax = false,
}: BuildTransactionCommonEventParams): CommonLogEvent {
  const family = mainAccount.currency.family;
  const earnTransactionType = deriveEarnTransactionType(family, rawTransactionType);
  return {
    appVersion: getEnv("LEDGER_CLIENT_VERSION"),
    flow,
    currencyId: mainAccount.currency.id,
    family,
    currencyTicker: mainAccount.currency.ticker,
    isTestnet: Boolean(mainAccount.currency.isTestnetFor),
    isSendMax,
    ...(manifestId ? { manifestId } : {}),
    ...(source ? { source } : {}),
    ...(earnTransactionType ? { earnTransactionType } : {}),
    ...(rawTransactionType ? { rawTransactionType } : {}),
    ...(validators?.length ? { validators } : {}),
    ...(account.type === "TokenAccount"
      ? { tokenId: account.token.id, tokenTicker: account.token.ticker }
      : {}),
  };
}

export function buildTransactionSuccessEvent(common: CommonLogEvent): SuccessLogEvent {
  return { status: "success", stage: TransactionStage.Broadcast, ...common };
}

/** Funnel-top event: an attempt reached a lifecycle stage (e.g. the device sign prompt appeared). */
export function buildTransactionStartedEvent(
  common: CommonLogEvent,
  stage: TransactionStage,
): StartedLogEvent {
  return { status: "started", stage, ...common };
}

/**
 * Drop-off event: the user dismissed the sign prompt without confirming or erroring
 * (an unsubscribe, invisible to the bridge — emitted from the device-action layer).
 */
export function buildTransactionAbandonedEvent(common: CommonLogEvent): FailureLogEvent {
  return {
    status: "failure",
    stage: TransactionStage.Sign,
    error: new Error("Sign prompt dismissed"),
    errorCategory: ErrorCategory.UserModalDismissed,
    ...common,
  };
}

export type BuildTransactionFailureParams = {
  stage: TransactionStage;
  error: unknown;
  /** Only available when signing succeeded (broadcast-stage failures). */
  signedOperation?: SignedOperation;
};

export function buildTransactionFailureEvent(
  common: CommonLogEvent,
  { stage, error, signedOperation }: BuildTransactionFailureParams,
): FailureLogEvent {
  // Unwrapped once, here, so both the category and the reported `error.name` describe
  // the real cause rather than an RPC envelope.
  const err = toError(unwrapRpcError(error));
  return {
    status: "failure",
    stage,
    error: err,
    errorCategory: classifyTransactionError(err),
    ...(signedOperation
      ? {
          txPayload: {
            signature: signedOperation.signature,
            ...(signedOperation.rawData ? { rawData: signedOperation.rawData } : {}),
          },
        }
      : {}),
    ...common,
  };
}
