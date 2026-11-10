import { setBorrowManifestIdReader } from "./borrowApps";
import {
  abandonPendingDappTxLifecycle,
  clearPendingDappTxLifecycle,
  clearPendingTxLifecycle,
  setBorrowTxLifecycleBaseUrl,
  type TxLifecyclePlatform,
} from "./txLifecycle";

/**
 * Like Earn's, the observer runs outside React and the kill-switch is read through the same
 * injected slice reader the hook uses, so both agree on local overrides.
 */
type BorrowTxLifecycleFlagReader = () => boolean;

let readFlag: BorrowTxLifecycleFlagReader | null = null;

export function setBorrowTxLifecycleFlagReader(reader: BorrowTxLifecycleFlagReader | null): void {
  readFlag = reader;
}

export function isBorrowTxLifecycleMonitoringEnabled(): boolean {
  return readFlag?.() ?? false;
}

/**
 * Closes a Borrow attempt the user left behind: when the webview goes away with a sign still
 * pending, no terminal will ever arrive, and the live app cannot report it from a dead page.
 * Unlike Earn there is no placeholder intent: only a real sign attempt can be abandoned.
 */
export function startBorrowLifecycleMonitoring(
  platform: TxLifecyclePlatform,
  manifestId: string | undefined,
  enabled: boolean,
): (() => void) | undefined {
  if (!manifestId) return;

  if (!enabled) {
    clearPendingDappTxLifecycle(platform, manifestId);
    return;
  }

  return () => {
    if (isBorrowTxLifecycleMonitoringEnabled()) {
      abandonPendingDappTxLifecycle(platform, manifestId);
    }
  };
}

/**
 * Wires the readers the Borrow monitoring needs at boot and returns the store listener that
 * drops pending attempts when the kill-switch is turned off at runtime.
 */
export function installBorrowLifecycleHost(config: {
  platform: TxLifecyclePlatform;
  readEnabled: BorrowTxLifecycleFlagReader;
  readManifestId: () => string | undefined;
  apiBaseUrl?: string;
}): () => void {
  const { platform, readEnabled, readManifestId, apiBaseUrl } = config;

  setBorrowTxLifecycleBaseUrl(apiBaseUrl);
  setBorrowTxLifecycleFlagReader(readEnabled);
  setBorrowManifestIdReader(readManifestId);

  let wasEnabled = readEnabled();
  return () => {
    const enabled = readEnabled();
    if (wasEnabled && !enabled) clearPendingTxLifecycle(platform, "borrow");
    wasEnabled = enabled;
  };
}
