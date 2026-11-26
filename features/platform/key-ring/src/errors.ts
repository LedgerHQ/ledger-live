import { KeyRingErrorCategorySchema } from "./schema";
import type { KeyRingErrorCategory } from "./types";
import { getErrorName } from "./internals/errors";
import { TRANSLATION_NAMES } from "./internals/translationNames";
import { V1_ERROR_CATEGORIES } from "./internals/v1/errorCategories";

/**
 * A key ring failure with a category both protocol versions report. Every `KeyRingClient`
 * operation and `KeyRingStream` call fails with one when the failure belongs to the key ring;
 * other failures (a device disconnection, an app bug) pass through unchanged. A mapped v1 error
 * keeps its message and stays available as `cause`.
 */
export class KeyRingError extends Error {
  override name: string = "KeyRingError";
  readonly category: KeyRingErrorCategory;
  constructor(category: KeyRingErrorCategory, message?: string, options?: ErrorOptions) {
    super(message ?? category, options);
    this.category = category;
  }
}

/** `member-removed`: another instance removed this one, or it has no member key or key tree. */
export class KeyRingMemberRemovedError extends KeyRingError {
  override name = "KeyRingMemberRemovedError" as const;
  constructor(
    message = "This instance is no longer a member of the key tree",
    options?: ErrorOptions,
  ) {
    super("member-removed", message, options);
  }
}

/** `tree-not-found`: the key tree of the session is gone from the backend. */
export class KeyRingTreeNotFoundError extends KeyRingError {
  override name = "KeyRingTreeNotFoundError" as const;
  constructor(message = "The key tree does not exist", options?: ErrorOptions) {
    super("tree-not-found", message, options);
  }
}

/** `outdated`: the key rotated since the session loaded it; `restore` reloads it. */
export class KeyRingOutdatedError extends KeyRingError {
  override name = "KeyRingOutdatedError" as const;
  constructor(
    message = "The key of the key tree changed since it was loaded",
    options?: ErrorOptions,
  ) {
    super("outdated", message, options);
  }
}

/** `not-allowed`: this instance has no permission on the key tree. */
export class KeyRingNotAllowedError extends KeyRingError {
  override name = "KeyRingNotAllowedError" as const;
  constructor(message = "This instance is not allowed on the key tree", options?: ErrorOptions) {
    super("not-allowed", message, options);
  }
}

/** `network`: the key ring backend could not be reached or failed. Retrying may succeed. */
export class KeyRingNetworkError extends KeyRingError {
  override name = "KeyRingNetworkError" as const;
  constructor(message = "The key ring service could not be reached", options?: ErrorOptions) {
    super("network", message, options);
  }
}

/** `device-unsupported`: the device or its firmware cannot run the key ring protocol. */
export class KeyRingDeviceUnsupportedError extends KeyRingError {
  override name = "KeyRingDeviceUnsupportedError" as const;
  constructor(message = "The device cannot run the key ring protocol", options?: ErrorOptions) {
    super("device-unsupported", message, options);
  }
}

/**
 * `pairing-closed`: the QR code pairing channel closed before the other instance joined. A host
 * that waited long enough can show a new QR code.
 */
export class KeyRingPairingClosedError extends KeyRingError {
  override name = "KeyRingPairingClosedError" as const;
  /** How long the channel stayed open, in milliseconds, when the protocol reports it. */
  readonly elapsedMs: number | undefined;
  constructor(
    message = "The pairing channel closed",
    options?: ErrorOptions & Readonly<{ elapsedMs?: number }>,
  ) {
    super("pairing-closed", message, options);
    this.elapsedMs = options?.elapsedMs;
  }
}

/**
 * The category of any error a key ring operation throws: a `KeyRingError`, or a protocol error
 * matched by name so it survives a lost prototype. Undefined for any other error. Branch on it
 * rather than on error classes, which change with the protocol version.
 *
 * @example
 * ```ts
 * switch (classifyKeyRingError(error)) {
 *   case "user-refused":
 *     return showRetry();
 *   case "outdated":
 *     return dispatch(commitKeyRingTree(await client.restore(session)));
 *   case "member-removed":
 *     return dispatch(resetKeyRingState());
 *   default:
 *     throw error;
 * }
 * ```
 */
export function classifyKeyRingError(error: unknown): KeyRingErrorCategory | undefined {
  const typed = categoryOfKeyRingError(error);
  if (typed) return typed;
  const name = getErrorName(error);
  return name === undefined ? undefined : V1_ERROR_CATEGORIES.get(name);
}

/** True when `error` is a key ring error of `category`. */
export function isKeyRingError(error: unknown, category: KeyRingErrorCategory): boolean {
  return classifyKeyRingError(error) === category;
}

/**
 * Maps any key ring failure to a `KeyRingError`, keeping the original message and the original
 * error as `cause`. Undefined when `error` is not a key ring failure. The client already throws
 * mapped errors; use it on errors from other sources, such as a serialized error.
 */
export function toKeyRingError(error: unknown): KeyRingError | undefined {
  if (error instanceof KeyRingError) return error;
  const category = classifyKeyRingError(error);
  if (!category) return undefined;
  const message = messageOf(error);
  if (category === "pairing-closed") {
    return new KeyRingPairingClosedError(message, { cause: error, elapsedMs: elapsedMsOf(error) });
  }
  const TypedError = TYPED_ERRORS[category];
  return TypedError
    ? new TypedError(message, { cause: error })
    : new KeyRingError(category, message, { cause: error });
}

/**
 * The error to hand to an error screen, so it shows the same translated text as before typed
 * errors: both apps translate key ring errors by their v1 names. Returns the original v1 error
 * when there is one, an error named after the category's translation otherwise, and any other
 * error unchanged.
 *
 * @example
 * ```tsx
 * <ErrorDisplay error={keyRingErrorForDisplay(error)} onRetry={onRetry} />
 * ```
 */
export function keyRingErrorForDisplay(error: unknown): unknown {
  if (!(error instanceof KeyRingError)) return error;
  if (error.cause instanceof Error) return error.cause;
  const translated = new Error(error.message);
  translated.name = TRANSLATION_NAMES[error.category];
  return translated;
}

const TYPED_ERRORS: Partial<
  Record<KeyRingErrorCategory, new (message?: string, options?: ErrorOptions) => KeyRingError>
> = {
  "member-removed": KeyRingMemberRemovedError,
  "tree-not-found": KeyRingTreeNotFoundError,
  outdated: KeyRingOutdatedError,
  "not-allowed": KeyRingNotAllowedError,
  network: KeyRingNetworkError,
  "device-unsupported": KeyRingDeviceUnsupportedError,
};

function categoryOfKeyRingError(error: unknown): KeyRingErrorCategory | undefined {
  if (typeof error !== "object" || error === null || !("category" in error)) return undefined;
  // A serialized KeyRingError keeps its name and category; other plain objects are not ours.
  if (!(error instanceof Error) && !getErrorName(error)?.startsWith("KeyRing")) return undefined;
  const parsed = KeyRingErrorCategorySchema.safeParse(error.category);
  return parsed.success ? parsed.data : undefined;
}

function messageOf(error: unknown): string | undefined {
  if (error instanceof Error) return error.message;
  const message = (error as { message?: unknown } | null)?.message;
  return typeof message === "string" ? message : undefined;
}

function elapsedMsOf(error: unknown): number | undefined {
  const time = (error as { time?: unknown } | null)?.time;
  return typeof time === "number" ? time : undefined;
}
