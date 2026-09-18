import type { ZcashPrivateInfoRaw } from "@ledgerhq/coin-zcash/network/types";

/**
 * An already-activated Zcash private balance, minus the shielded address
 * (caller-specific, see seedZcashPrivateInfo in cliCommandsUtils.ts). The
 * UFVK is left null and sync disabled so this fixture cannot feed a
 * malformed viewing key to any scanning path, rather than relying on none
 * being reachable.
 */
export const ZCASH_TEST_PRIVATE_INFO: Omit<ZcashPrivateInfoRaw, "shieldedAddress"> = {
  orchardBalance: "0",
  saplingBalance: "0",
  ironwoodBalance: "0",
  syncState: "disabled",
  progress: 0,
  estimatedTimeRemaining: { hours: 0, minutes: 0 },
  ufvk: null,
  birthday: "2026-08-01",
  lastSyncTimestamp: null,
  lastProcessedBlock: null,
  transactions: [],
};
