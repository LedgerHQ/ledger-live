import { isBorrowApp, setBorrowManifestIdReader } from "./borrowApps";
import {
  abandonPendingDappTxLifecycle,
  clearPendingDappTxLifecycle,
  clearPendingTxLifecycle,
  normalizeTxLifecycleBaseUrl,
  type TxLifecyclePayload,
  type TxLifecyclePlatform,
  type TxLifecycleProduct,
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

const DEFAULT_BORROW_API_BASE_URL = "https://global.api.prd.ledger.com/borrow";

let borrowApiBaseUrl = DEFAULT_BORROW_API_BASE_URL;

/** Borrow has its own sink, so its base URL is configured apart from Earn's. */
export function setBorrowTxLifecycleBaseUrl(baseUrl: string | undefined): void {
  borrowApiBaseUrl = normalizeTxLifecycleBaseUrl(baseUrl, DEFAULT_BORROW_API_BASE_URL);
}

/**
 * The Borrow live app owns its intent and its success/failure terminals, because only it knows
 * the action (supply, borrow, repay, withdraw) the wire contract has no field for. The host
 * therefore tracks Borrow attempts locally and only reports what the app cannot: an attempt
 * that ended without any terminal (abandoned). Everything else would double count.
 */
function isAbandoned(payload: TxLifecyclePayload): boolean {
  return (
    payload.event === "tx_terminal" &&
    payload.outcome === "failure" &&
    payload.failure_class === "abandoned"
  );
}

export const borrowLifecycleProduct: TxLifecycleProduct = {
  id: "borrow",
  pathOf: event => (isBorrowApp(event.manifestId) ? "dapp" : undefined),
  isEnabled: isBorrowTxLifecycleMonitoringEnabled,
  baseUrl: () => borrowApiBaseUrl,
  reports: isAbandoned,
};

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

  // An attempt left over from another surface or an earlier visit is not this screen's to report.
  clearPendingDappTxLifecycle(platform, manifestId);
  if (!enabled) return;

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
    if (wasEnabled && !enabled) clearPendingTxLifecycle(platform, borrowLifecycleProduct.id);
    wasEnabled = enabled;
  };
}
