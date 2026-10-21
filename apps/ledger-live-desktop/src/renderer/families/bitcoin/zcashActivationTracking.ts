import { useEffect } from "react";
import { track } from "@shared/analytics";
import { useSelector } from "LLD/hooks/redux";
import type { ZcashAccount } from "@ledgerhq/coin-zcash/types";
import { accountsSelector } from "~/renderer/reducers/accounts";

export const ZCASH_PRIVATE_BALANCE_ENABLED = "zcash_private_balance_enabled";
export const ZCASH_PRIVATE_BALANCE_ENABLE_FAILED = "zcash_private_balance_enable_failed";
export const ZCASH_PRIVATE_BALANCE_FIRST_SYNC_COMPLETED =
  "zcash_private_balance_first_sync_completed";
export const ZCASH_PRIVATE_BALANCE_FIRST_SYNC_FAILED = "zcash_private_balance_first_sync_failed";

export type EnableFailureReason = "user_refused" | "device_error" | "app_error" | "unknown";

// The names the UFVK export can fail with, by `error.name` only: the message may carry
// device or transport detail and never leaves the app. Sources: the Zcash signer's
// error mapping (UserRefusedOnDevice), the transport opening in `withDevice`
// (CantOpenDevice, pairing and Bluetooth/USB availability errors), the disconnect and
// lock errors of the device layer, and the app errors of the connect-app step. A signer
// kit error surfaced by tag is a plain `Error` and stays "unknown".
const DEVICE_ERROR_NAMES = new Set([
  "DisconnectedDevice",
  "DisconnectedDeviceDuringOperation",
  "LockedDeviceError",
  "CantOpenDevice",
  "BluetoothRequired",
  "TransportWebUSBGestureRequired",
  "TransportInterfaceNotAvailable",
  "PeerRemovedPairing",
  "PairingFailed",
  "TransportRaceCondition",
]);

const APP_ERROR_NAMES = new Set([
  "WrongAppForCurrency",
  "UpdateYourApp",
  "FirmwareOrAppUpdateRequired",
  "UnsupportedV6SourceTransaction",
]);

export function getEnableFailureReason(error: unknown): EnableFailureReason {
  const name = (error as { name?: unknown } | null | undefined)?.name;
  if (typeof name !== "string") return "unknown";
  if (name === "UserRefusedOnDevice") return "user_refused";
  if (DEVICE_ERROR_NAMES.has(name)) return "device_error";
  if (APP_ERROR_NAMES.has(name)) return "app_error";
  return "unknown";
}

export type DurationBucket = "under_5m" | "5m_30m" | "30m_2h" | "2h_6h" | "over_6h";

const MINUTE_MS = 60_000;

/** Coarse bucket of a duration: the exact time of a sync is not reported. */
export function getDurationBucket(ms: number): DurationBucket {
  if (ms < 5 * MINUTE_MS) return "under_5m";
  if (ms < 30 * MINUTE_MS) return "5m_30m";
  if (ms < 120 * MINUTE_MS) return "30m_2h";
  if (ms < 360 * MINUTE_MS) return "2h_6h";
  return "over_6h";
}

// Accounts whose private balance was enabled in this session and whose first sync has
// not ended yet, with the enabling time. Nothing is persisted: closing the app before
// the first sync ends means no event for it.
const pendingFirstSync = new Map<string, number>();

export function markPrivateBalanceEnabled(accountId: string, now = Date.now()) {
  pendingFirstSync.set(accountId, now);
}

function reportFirstSyncFailed(accountId: string, enabledAt: number, now: number) {
  track(ZCASH_PRIVATE_BALANCE_FIRST_SYNC_FAILED, {
    currency: "zcash",
    durationBucket: getDurationBucket(now - enabledAt),
    reason: "sync_error",
  });
  pendingFirstSync.delete(accountId);
}

/**
 * Reports a failed first private sync that the account state does not show: a sync
 * started by hand stops without `lastSyncError`, like a user stop, so that the wallet
 * sync does not retry it on its own.
 */
export function markFirstSyncFailed(accountId: string, now = Date.now()) {
  const enabledAt = pendingFirstSync.get(accountId);
  if (enabledAt !== undefined) reportFirstSyncFailed(accountId, enabledAt, now);
}

/**
 * Reports how the first private sync of an account enabled in this session ended.
 * A user stop is neither a success nor a failure, so it keeps waiting.
 */
export function useZcashFirstSyncTracking() {
  const accounts = useSelector(accountsSelector);

  useEffect(() => {
    if (pendingFirstSync.size === 0) return;
    const now = Date.now();
    for (const [accountId, enabledAt] of pendingFirstSync) {
      const account = accounts.find(a => a.id === accountId) as ZcashAccount | undefined;
      if (!account) {
        pendingFirstSync.delete(accountId);
        continue;
      }
      const { syncState, lastSyncError } = account.privateInfo ?? {};
      if (syncState === "complete") {
        track(ZCASH_PRIVATE_BALANCE_FIRST_SYNC_COMPLETED, {
          currency: "zcash",
          durationBucket: getDurationBucket(now - enabledAt),
        });
        pendingFirstSync.delete(accountId);
      } else if (syncState === "stopped" && lastSyncError) {
        reportFirstSyncFailed(accountId, enabledAt, now);
      }
    }
  }, [accounts]);
}

/** Mounts `useZcashFirstSyncTracking` as the family's app-wide effect. */
export function ZcashFirstSyncTracking(): null {
  useZcashFirstSyncTracking();
  return null;
}
