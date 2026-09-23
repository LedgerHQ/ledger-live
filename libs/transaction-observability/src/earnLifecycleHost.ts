import { setTransactionObserver } from "./observer";
import { setStakeProgramAppsReader, stakeProgramAppIds } from "./stakingApps";
import {
  abandonPendingDappTxLifecycle,
  clearPendingDappTxLifecycle,
  clearPendingTxLifecycle,
  sendTxLifecycle,
  setTxLifecycleBaseUrl,
  startDappTxLifecycle,
  toTxLifecyclePayload,
  type TxLifecyclePlatform,
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

/**
 * Sends the consent-independent lifecycle events. Separate from the Segment observer each host
 * registers: this one answers to its own kill-switch rather than to analytics consent.
 */
export function registerTxLifecycleObserver(platform: TxLifecyclePlatform): void {
  setTransactionObserver(event => {
    if (!isEarnTxLifecycleMonitoringEnabled()) {
      clearPendingTxLifecycle(platform);
      return;
    }

    const payload = toTxLifecyclePayload(event, platform);
    if (!payload) return;

    // The manifest stays local: it correlates the attempt here and never reaches the wire.
    sendTxLifecycle(payload, event.manifestId);
  });
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
    if (wasEnabled && !enabled) clearPendingTxLifecycle(platform);
    wasEnabled = enabled;
  };
}
