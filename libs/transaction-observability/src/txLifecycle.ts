import { ErrorCategory } from "./errorCategory";
import { TransactionPathway, type LogEvent } from "./logEvent";
import { isEarnMonitoringApp } from "./stakingApps";

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

const APP_OWNED_MANIFEST_IDS = new Set(["earn", "earn-stg", "earn-prd-eks"]);
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

function resolvePath(event: LogEvent): TxLifecyclePath | undefined {
  if (event.manifestId) {
    if (APP_OWNED_MANIFEST_IDS.has(event.manifestId) || !isEarnMonitoringApp(event.manifestId)) {
      return undefined;
    }
    return "dapp";
  }

  if (
    event.earnTransactionType &&
    (event.pathway === TransactionPathway.Send || event.pathway === TransactionPathway.Unknown)
  ) {
    return "native";
  }

  return undefined;
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

  return "unknown";
}

export function toTxLifecyclePayload(
  event: LogEvent,
  platform: TxLifecyclePlatform,
): TxLifecyclePayload | null {
  const path = resolvePath(event);
  if (!path) return null;

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
const DEFAULT_EARN_API_BASE_URL = "https://earn.api.live.ledger.com";

/**
 * `@shared/env` is being sunset, so the endpoint follows the `process.env` override convention
 * wallet-cli already uses for this same backend (`wallet/earn/config.ts`) rather than adding a
 * registry entry. Staging is reachable by setting the variable at boot.
 */
function earnApiBaseUrl(): string {
  const base = process.env.EARN_API_BASE_URL || DEFAULT_EARN_API_BASE_URL;
  return base.replace(/\/+$/, "");
}

const pendingLifecycle = new Map<string, TxLifecyclePayloadBase>();

function lifecycleKey(payload: Pick<TxLifecyclePayloadBase, "path" | "platform">): string {
  return `${payload.platform}:${payload.path}`;
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

export function sendTxLifecycle(payload: TxLifecyclePayload): void {
  const key = lifecycleKey(payload);
  if (payload.event === "tx_intent") {
    const next = lifecycleBase(payload);
    const pending = pendingLifecycle.get(key);
    if (pending && sameLifecycleBase(pending, next)) return;
    if (pending?.path === "dapp" && pending.currency_family === "other") {
      pendingLifecycle.set(key, next);
      return;
    }
    if (pending) {
      abandonPendingLifecycle(payload.platform, payload.path);
    }
    pendingLifecycle.set(key, next);
  } else {
    if (!pendingLifecycle.has(key)) return;
    pendingLifecycle.delete(key);
  }

  const baseUrl = earnApiBaseUrl();
  if (!baseUrl) return;

  try {
    void fetch(`${baseUrl}${TX_LIFECYCLE_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Monitoring must never affect the transaction flow.
  }
}

function abandonPendingLifecycle(platform: TxLifecyclePlatform, path: TxLifecyclePath): void {
  const pending = pendingLifecycle.get(lifecycleKey({ platform, path }));
  if (!pending) return;

  sendTxLifecycle({
    ...pending,
    event: "tx_terminal",
    outcome: "failure",
    failure_class: "abandoned",
  });
}

export function abandonPendingDappTxLifecycle(platform: TxLifecyclePlatform): void {
  abandonPendingLifecycle(platform, "dapp");
}

export function clearPendingDappTxLifecycle(platform: TxLifecyclePlatform): void {
  pendingLifecycle.delete(lifecycleKey({ platform, path: "dapp" }));
}

export function clearPendingTxLifecycle(platform: TxLifecyclePlatform): void {
  pendingLifecycle.delete(lifecycleKey({ platform, path: "native" }));
  pendingLifecycle.delete(lifecycleKey({ platform, path: "dapp" }));
}

export function startDappTxLifecycle(
  platform: TxLifecyclePlatform,
  manifestId: string | undefined,
): void {
  if (!manifestId || APP_OWNED_MANIFEST_IDS.has(manifestId) || !isEarnMonitoringApp(manifestId)) {
    return;
  }

  // Every host sets this alongside the `LEDGER_CLIENT_VERSION` env read the sign events carry, so
  // the placeholder intent reports the same string as the terminal that closes it.
  const appVersion = process.env.LEDGER_CLIENT_VERSION;
  sendTxLifecycle({
    schema_version: 1,
    event: "tx_intent",
    path: "dapp",
    platform,
    currency_family: "other",
    ...(appVersion ? { app_version: appVersion } : {}),
  });
}
