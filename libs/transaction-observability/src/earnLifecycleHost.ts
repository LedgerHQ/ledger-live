import { TransactionPathway, type LogEvent } from "./logEvent";
import { isEarnMonitoringApp, setStakeProgramAppsReader, stakeProgramAppIds } from "./stakingApps";
import {
  abandonPendingDappTxLifecycle,
  clearPendingDappTxLifecycle,
  clearPendingTxLifecycle,
  normalizeTxLifecycleBaseUrl,
  sendTxLifecycle,
  type TxLifecyclePath,
  type TxLifecyclePlatform,
  type TxLifecycleProduct,
} from "./txLifecycle";

/**
 * The lifecycle observer runs outside React, so it cannot use `useFeature`. Reading LiveConfig
 * directly would miss the local overrides the Redux slice resolves, letting the dApp hook and
 * this observer disagree about the kill-switch. Boot injects the same slice reader both use.
 */
type EarnTxLifecycleFlagReader = () => boolean;

let readFlag: EarnTxLifecycleFlagReader | null = null;

export function setEarnTxLifecycleFlagReader(reader: EarnTxLifecycleFlagReader | null): void {
  readFlag = reader;
}

export function isEarnTxLifecycleMonitoringEnabled(): boolean {
  return readFlag?.() ?? false;
}

/** The Earn live app reports its own lifecycle; the host only monitors partner dApps. */
const APP_OWNED_MANIFEST_IDS = new Set(["earn", "earn-stg", "earn-prd-eks"]);
const DEFAULT_EARN_API_BASE_URL = "https://earn.api.live.ledger.com";

let earnApiBaseUrl = DEFAULT_EARN_API_BASE_URL;

export function setTxLifecycleBaseUrl(baseUrl: string | undefined): void {
  earnApiBaseUrl = normalizeTxLifecycleBaseUrl(baseUrl, DEFAULT_EARN_API_BASE_URL);
}

function isMonitoredDapp(manifestId: string): boolean {
  return !APP_OWNED_MANIFEST_IDS.has(manifestId) && isEarnMonitoringApp(manifestId);
}

function earnPathOf(event: LogEvent): TxLifecyclePath | undefined {
  if (event.manifestId) return isMonitoredDapp(event.manifestId) ? "dapp" : undefined;

  const isNativeRoute =
    event.pathway === TransactionPathway.Send || event.pathway === TransactionPathway.Unknown;
  return event.earnTransactionType && isNativeRoute ? "native" : undefined;
}

export const earnLifecycleProduct: TxLifecycleProduct = {
  id: "earn",
  pathOf: earnPathOf,
  isEnabled: isEarnTxLifecycleMonitoringEnabled,
  baseUrl: () => earnApiBaseUrl,
};

declare const process: { env: Record<string, string | undefined> };

// The desktop bundler rewrites `process.env`; its renderer has no global `process`.
function readClientVersion(): string | undefined {
  try {
    return process.env.LEDGER_CLIENT_VERSION;
  } catch {
    return undefined;
  }
}

export function startDappTxLifecycle(
  platform: TxLifecyclePlatform,
  manifestId: string | undefined,
): void {
  if (!manifestId || !isMonitoredDapp(manifestId)) return;

  // Every host sets this alongside the `LEDGER_CLIENT_VERSION` env read the sign events carry, so
  // the placeholder intent reports the same string as the terminal that closes it.
  const appVersion = readClientVersion();
  sendTxLifecycle(
    earnLifecycleProduct,
    {
      schema_version: 1,
      event: "tx_intent",
      path: "dapp",
      platform,
      currency_family: "other",
      ...(appVersion ? { app_version: appVersion } : {}),
    },
    manifestId,
  );
}

/**
 * Opens a dApp attempt when a Ledger-owned stake CTA hands off to a partner app, and closes it
 * when the webview goes away. Hosts call this from an effect so the React dependency on the
 * kill-switch stays in their own feature-flag layer.
 */
export function startDappLifecycleMonitoring(
  platform: TxLifecyclePlatform,
  manifestId: string | undefined,
  isStakeRedirect: boolean,
  enabled: boolean,
): (() => void) | undefined {
  if (!manifestId || !isStakeRedirect) return;

  if (!enabled) {
    clearPendingDappTxLifecycle(platform, manifestId);
    return;
  }

  startDappTxLifecycle(platform, manifestId);
  return () => {
    if (isEarnTxLifecycleMonitoringEnabled()) {
      abandonPendingDappTxLifecycle(platform, manifestId);
    }
  };
}

/** The part of the `stakePrograms` feature this package needs; hosts pass their own richer type. */
type StakeProgramsFeature = {
  enabled: boolean;
  params?: { redirects?: Record<string, { platform: string }> | null } | null;
};

/**
 * Wires the readers the monitoring needs at boot and returns the store listener that drops
 * pending attempts when the kill-switch is turned off at runtime.
 *
 * The monitored manifests are the stake redirects this client version actually opens, so the
 * hosts pass their state access and their own version resolver rather than repeating the rule.
 */
export function installEarnLifecycleHost<F extends StakeProgramsFeature>(config: {
  platform: TxLifecyclePlatform;
  readEnabled: EarnTxLifecycleFlagReader;
  readStakePrograms: () => F | null | undefined;
  resolveVersionedRedirects: (feature: F, appVersion: string) => F;
  readAppVersion: () => string;
  apiBaseUrl?: string;
}): () => void {
  const {
    platform,
    readEnabled,
    readStakePrograms,
    resolveVersionedRedirects,
    readAppVersion,
    apiBaseUrl,
  } = config;

  setTxLifecycleBaseUrl(apiBaseUrl);
  setEarnTxLifecycleFlagReader(readEnabled);
  setStakeProgramAppsReader(() => {
    const stakePrograms = readStakePrograms();
    if (!stakePrograms?.enabled) return [];

    const resolved = resolveVersionedRedirects(stakePrograms, readAppVersion());
    return stakeProgramAppIds(resolved.params?.redirects ?? undefined);
  });

  let wasEnabled = readEnabled();
  return () => {
    const enabled = readEnabled();
    if (wasEnabled && !enabled) clearPendingTxLifecycle(platform, earnLifecycleProduct.id);
    wasEnabled = enabled;
  };
}
