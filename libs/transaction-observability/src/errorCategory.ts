/**
 * Normalized, countable error categories spanning the sign and broadcast stages.
 *
 * Shared taxonomy with the Earn live app's classifier (LIVE-34203). Ledger Wallet can only
 * classify what it observes (device / user / gas / blockchain); `validation`, `partner` and
 * `geolocation` originate in the app and are classified app-side using the same values.
 *
 * `Unknown` is a measurement of this list, not a resting place: a rising `unknown` share means
 * the taxonomy has fallen behind the errors users actually hit, and is a signal to extend it.
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

const namedError = (name: string, message = ""): Error =>
  Object.assign(new Error(message), { name });

/**
 * Only a primitive makes a usable code — an object would stringify as "[object Object]".
 * `rpc_unknown` rather than passing the error through, so "no envelope was recognised" stays
 * countable separately from "an envelope was recognised but its code was unreadable".
 */
const rpcCodeName = (code: unknown): string =>
  typeof code === "number" || typeof code === "string" ? `rpc_${code}` : "rpc_unknown";

/** Ledger Wallet's EIP-1193 provider error, on the dApp path: a code and a reason, no name. */
function fromProviderError(error: object): Error | undefined {
  const provider = error as { isRpcError?: unknown; code?: unknown; reason?: unknown };
  if (provider.isRpcError !== true) return undefined;

  const message = typeof provider.reason === "string" ? provider.reason : "";
  // EIP-1193: 4001 is the user declining the request.
  return provider.code === 4001
    ? namedError("UserRejectedRequest", message)
    : namedError(rpcCodeName(provider.code), message);
}

/**
 * A real error forwarded verbatim through the envelope: it kept its `name`, and possibly a
 * device `statusCode` — both of which {@link classifyTransactionError} depends on.
 */
function serialisedError(data: object): Error | undefined {
  const nested = ((data as { data?: unknown }).data ?? data) as {
    name?: unknown;
    message?: unknown;
    statusCode?: unknown;
  };
  if (typeof nested.name !== "string") return undefined;

  const unwrapped = namedError(
    nested.name,
    typeof nested.message === "string" ? nested.message : "",
  );
  return typeof nested.statusCode === "number"
    ? Object.assign(unwrapped, { statusCode: nested.statusCode })
    : unwrapped;
}

/** The wallet-api's own protocol code, for when no inner error survived the trip. */
function protocolCodeError(data: object): Error | undefined {
  const { code, message } = data as { code?: unknown; message?: unknown };
  return typeof code === "string"
    ? namedError(code, typeof message === "string" ? message : "")
    : undefined;
}

/** A Wallet API envelope, whose cause sits behind `getData()` / `getCode()`. */
function fromWalletApiEnvelope(error: object): Error | undefined {
  const envelope = error as { getData?: () => unknown; getCode?: () => unknown };
  if (typeof envelope.getData !== "function") return undefined;

  const data = envelope.getData();
  if (data && typeof data === "object") {
    const inner = serialisedError(data) ?? protocolCodeError(data);
    if (inner) return inner;
  }

  const code = envelope.getCode?.();
  return code === undefined ? undefined : namedError(rpcCodeName(code));
}

/**
 * Unwrap an RPC failure envelope so the real cause is what gets classified and reported.
 *
 * Without this, every RPC-wrapped failure lands in the same `unknown` bucket: neither the
 * Wallet API's `RpcError`/`ServerError` nor Ledger Wallet's dApp-path `RpcError` sets `name`
 * — it stays the default "Error" — and the cause sits behind accessors. That would leave the
 * funnel able to count failures but not tell them apart, which is half the point of measuring
 * them. Device and coin errors need no unwrapping: the RPC layer round-trips those through
 * `@ledgerhq/errors`, so their `name` survives.
 *
 * One extractor per envelope shape, tried in order of how much they preserve. An error that
 * matches none is returned untouched.
 */
export function unwrapRpcError(error: unknown): unknown {
  if (!error || typeof error !== "object") return error;
  return fromProviderError(error) ?? fromWalletApiEnvelope(error) ?? error;
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

/**
 * Maps an arbitrary sign/broadcast error to a normalized {@link ErrorCategory}.
 *
 * Pure string-matching (no coin-module imports): stable error `name`s first (Ledger custom
 * errors plus device/transport errors), then stable substrings in `error.message`. App-only
 * categories fall through to `Unknown` here and are classified app-side.
 */
export function classifyTransactionError(error: Error): ErrorCategory {
  const name = error.name ?? "";
  const message = (error.message ?? "").toUpperCase();

  switch (name) {
    case "WrongDeviceForAccount":
      return ErrorCategory.DeviceWrongAccount;
    case "UserRefusedOnDevice":
    case "UserRefusedAllowManager":
    case "TransactionRefusedOnDevice":
      return ErrorCategory.UserDeviceRefused;
    // EIP-1193 4001, unwrapped from a dApp provider error: declined in the UI, not on device.
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

  // The status code distinguishes a user decline (CONDITIONS_OF_USE_NOT_SATISFIED) from
  // other device faults.
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
