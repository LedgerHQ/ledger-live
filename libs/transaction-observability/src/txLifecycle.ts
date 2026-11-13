import { ErrorCategory } from "./errorCategory";
import type { LogEvent } from "./logEvent";
import { setTransactionObserver } from "./observer";

export type TxLifecyclePlatform = "desktop" | "mobile";
export type TxLifecyclePath = "native" | "dapp";
export type TxLifecycleFailureClass =
  | "user_cancel"
  | "device_error"
  | "broadcast_error"
  | "abandoned"
  | "unknown";

type TxLifecyclePayloadBase = {
  schema_version: 1;
  path: TxLifecyclePath;
  platform: TxLifecyclePlatform;
  currency_family:
    | "solana"
    | "cosmos"
    | "tezos"
    | "near"
    | "ethereum"
    | "bitcoin"
    | "polkadot"
    | "tron"
    | "multiversx"
    | "other";
  currency_id?: string;
  network?: string;
  app_version?: string;
};

export type TxLifecyclePayload = TxLifecyclePayloadBase &
  (
    | { event: "tx_intent"; outcome?: never; failure_class?: never }
    | { event: "tx_terminal"; outcome: "success"; failure_class?: never }
    | {
        event: "tx_terminal";
        outcome: "failure";
        failure_class: TxLifecycleFailureClass;
      }
  );

/**
 * Where a payload comes from: a transaction event the observer received, an attempt a new intent
 * replaced before any terminal arrived, or an attempt the screen hosting it left behind.
 */
export type TxLifecycleSource = "event" | "superseded" | "teardown";

/**
 * A product the lifecycle is monitored for. The core tracks attempts and posts them; each
 * product says which events are its own, which kill-switch it answers to and where it posts.
 */
export type TxLifecycleProduct = {
  readonly id: string;
  /** The path this product monitors the event on; undefined when the event is not its own. */
  pathOf(event: LogEvent): TxLifecyclePath | undefined;
  isEnabled(): boolean;
  baseUrl(): string;
  /** The payloads the host posts; the others only move the pending state. All when omitted. */
  reports?(payload: TxLifecyclePayload, source: TxLifecycleSource): boolean;
};

type TxLifecycleClaim = { product: TxLifecycleProduct; path: TxLifecyclePath };

/**
 * Exactly one product owns an event: the first in `products` that claims it. The list order is
 * the priority, so a manifest two products claim goes to the earlier one instead of being lost.
 */
export function resolveTxLifecycleProduct(
  products: readonly TxLifecycleProduct[],
  event: LogEvent,
): TxLifecycleClaim | undefined {
  for (const product of products) {
    const path = product.pathOf(event);
    if (path) return { product, path };
  }
  return undefined;
}
const CURRENCY_FAMILIES = new Set<TxLifecyclePayload["currency_family"]>([
  "solana",
  "cosmos",
  "tezos",
  "near",
  "ethereum",
  "bitcoin",
  "polkadot",
  "tron",
  "multiversx",
  "other",
]);

const FAMILY_ALIASES: Record<string, TxLifecyclePayload["currency_family"]> = {
  evm: "ethereum",
  elrond: "multiversx",
};

function normalizeFamily(family: string): TxLifecyclePayload["currency_family"] {
  const lower = family.toLowerCase();
  const alias = FAMILY_ALIASES[lower];
  if (alias) return alias;

  const candidate = lower as TxLifecyclePayload["currency_family"];
  return CURRENCY_FAMILIES.has(candidate) ? candidate : "other";
}

function failureClass(event: Extract<LogEvent, { status: "failure" }>): TxLifecycleFailureClass {
  if (event.abandoned) return "abandoned";

  switch (event.errorCategory) {
    case ErrorCategory.UserModalDismissed:
    case ErrorCategory.UserDeviceRefused:
      return "user_cancel";
    case ErrorCategory.DeviceDisconnected:
    case ErrorCategory.DeviceWrongAccount:
      return "device_error";
    case ErrorCategory.Blockchain:
    case ErrorCategory.GasInsufficientBalance:
    case ErrorCategory.GasFeeTooLow:
    case ErrorCategory.Partner:
    case ErrorCategory.Validation:
      return "broadcast_error";
    case ErrorCategory.Geolocation:
    case ErrorCategory.Unknown:
      return "unknown";
  }
}

export function buildTxLifecyclePayload(
  event: LogEvent,
  platform: TxLifecyclePlatform,
  path: TxLifecyclePath,
): TxLifecyclePayload {
  const base = {
    schema_version: 1 as const,
    path,
    platform,
    currency_family: normalizeFamily(event.family),
    ...(event.tokenId || event.currencyId
      ? { currency_id: event.tokenId ?? event.currencyId }
      : {}),
    ...(event.currencyId ? { network: event.currencyId } : {}),
    ...(event.appVersion ? { app_version: event.appVersion } : {}),
  };

  if (event.status === "intent") {
    return { ...base, event: "tx_intent" };
  }

  if (event.status === "success") {
    return { ...base, event: "tx_terminal", outcome: "success" };
  }

  return {
    ...base,
    event: "tx_terminal",
    outcome: "failure",
    failure_class: failureClass(event),
  };
}

const TX_LIFECYCLE_PATH = "/v1/tx/lifecycle";

function withoutTrailingSlashes(base: string): string {
  let end = base.length;
  while (end > 0 && base[end - 1] === "/") end--;
  return base.slice(0, end);
}

/**
 * Hosts resolve public configuration through their own build systems:
 * desktop uses a literal `process.env` replacement and mobile uses `react-native-config`.
 */
export function normalizeTxLifecycleBaseUrl(baseUrl: string | undefined, fallback: string): string {
  return withoutTrailingSlashes(baseUrl || fallback);
}

/**
 * An attempt keeps the product that opened it, so a later config change cannot reroute it: its
 * terminal and its abandon both go to that product.
 */
type PendingAttempt = { product: TxLifecycleProduct; base: TxLifecyclePayloadBase };

const pendingLifecycle = new Map<string, PendingAttempt>();

function lifecycleKey(
  payload: Pick<TxLifecyclePayloadBase, "path" | "platform">,
  manifestId?: string,
): string {
  return payload.path === "dapp"
    ? `${payload.platform}:${payload.path}:${manifestId ?? "unknown"}`
    : `${payload.platform}:${payload.path}`;
}

function lifecycleBase(payload: TxLifecyclePayload): TxLifecyclePayloadBase {
  return {
    schema_version: payload.schema_version,
    path: payload.path,
    platform: payload.platform,
    currency_family: payload.currency_family,
    ...(payload.currency_id ? { currency_id: payload.currency_id } : {}),
    ...(payload.network ? { network: payload.network } : {}),
    ...(payload.app_version ? { app_version: payload.app_version } : {}),
  };
}

function sameLifecycleBase(left: TxLifecyclePayloadBase, right: TxLifecyclePayloadBase): boolean {
  return (
    left.schema_version === right.schema_version &&
    left.path === right.path &&
    left.platform === right.platform &&
    left.currency_family === right.currency_family &&
    left.currency_id === right.currency_id &&
    left.network === right.network &&
    left.app_version === right.app_version
  );
}

function postTxLifecycle(
  product: TxLifecycleProduct,
  payload: TxLifecyclePayload,
  source: TxLifecycleSource,
): void {
  try {
    if (product.reports && !product.reports(payload, source)) return;
    void fetch(`${product.baseUrl()}${TX_LIFECYCLE_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Monitoring must never affect the transaction flow.
  }
}

function abandonPendingLifecycle(key: string, source: Exclude<TxLifecycleSource, "event">): void {
  const pending = pendingLifecycle.get(key);
  if (!pending) return;

  pendingLifecycle.delete(key);
  postTxLifecycle(
    pending.product,
    {
      ...pending.base,
      event: "tx_terminal",
      outcome: "failure",
      failure_class: "abandoned",
    },
    source,
  );
}

export function sendTxLifecycle(
  product: TxLifecycleProduct,
  payload: TxLifecyclePayload,
  manifestId?: string,
): void {
  const key = lifecycleKey(payload, manifestId);
  if (payload.event === "tx_intent") {
    const next = lifecycleBase(payload);
    const pending = pendingLifecycle.get(key)?.base;
    const isDappPlaceholder = pending?.path === "dapp" && pending.currency_family === "other";

    // A dApp sign observable may resubscribe without representing another user attempt.
    if (pending?.path === "dapp" && sameLifecycleBase(pending, next)) return;

    if (pending && !isDappPlaceholder) abandonPendingLifecycle(key, "superseded");
    pendingLifecycle.set(key, { product, base: next });
    postTxLifecycle(product, payload, "event");
    return;
  }

  const pending = pendingLifecycle.get(key);
  if (!pending) return;
  pendingLifecycle.delete(key);
  postTxLifecycle(pending.product, payload, "event");
}

function ownsPendingDapp(key: string, productId: string | undefined): boolean {
  const pending = pendingLifecycle.get(key);
  return !!pending && (productId === undefined || pending.product.id === productId);
}

/** Closes the pending dApp attempt, only when `productId` owns it if one is named. */
export function abandonPendingDappTxLifecycle(
  platform: TxLifecyclePlatform,
  manifestId: string,
  productId?: string,
): void {
  const key = lifecycleKey({ platform, path: "dapp" }, manifestId);
  if (ownsPendingDapp(key, productId)) abandonPendingLifecycle(key, "teardown");
}

/** Drops the pending dApp attempt, only when `productId` owns it if one is named. */
export function clearPendingDappTxLifecycle(
  platform: TxLifecyclePlatform,
  manifestId: string,
  productId?: string,
): void {
  const key = lifecycleKey({ platform, path: "dapp" }, manifestId);
  if (ownsPendingDapp(key, productId)) pendingLifecycle.delete(key);
}

/** Drops one product's pending attempts, or every product's when none is named. */
export function clearPendingTxLifecycle(platform: TxLifecyclePlatform, productId?: string): void {
  const prefix = `${platform}:`;
  for (const [key, pending] of pendingLifecycle) {
    if (key.startsWith(prefix) && (productId === undefined || pending.product.id === productId)) {
      pendingLifecycle.delete(key);
    }
  }
}

/**
 * Sends the consent-independent lifecycle events. Separate from the Segment observer each host
 * registers: each product answers to its own kill-switch rather than to analytics consent.
 */
export function observeTxLifecycle(
  platform: TxLifecyclePlatform,
  products: readonly TxLifecycleProduct[],
): () => void {
  return setTransactionObserver(event => {
    const enabled: TxLifecycleProduct[] = [];
    for (const product of products) {
      if (product.isEnabled()) enabled.push(product);
      else clearPendingTxLifecycle(platform, product.id);
    }

    // Only enabled products compete for an event: a product switched off must not take a
    // manifest away from one that is monitoring it.
    const claim = resolveTxLifecycleProduct(enabled, event);
    if (!claim) return;

    // The manifest stays local: it correlates the attempt here and never reaches the wire.
    sendTxLifecycle(
      claim.product,
      buildTxLifecyclePayload(event, platform, claim.path),
      event.manifestId,
    );
  });
}
