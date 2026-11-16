import type { FlashTarget } from "@ledgerhq/dmk-ledger-wallet";

export const MCU_FLASH_TARGET = "mcu" satisfies FlashTarget;

/**
 * Lets the device drop before the session is torn down after a reboot, so discovery cannot still
 * see the address or uid the device held before it restarted.
 */
export const REBOOT_SETTLE_DELAY_MS = 2_000;

/**
 * Bound the `waitForDeviceReady` invocations, applied by the invoking state rather than the actor.
 * Wall clock over the whole wait and not resettable, hence the generous values: a flash reboot that
 * legacy would wait out must not be aborted here.
 */
export const WAIT_READY_TIMEOUT_MS = 2 * 60 * 1_000;
export const WAIT_READY_TIMEOUT_AFTER_FLASH_MS = 5 * 60 * 1_000;

/** Share of the overall bar given to the updates, the rest going to the restore. */
export const UPDATES_WEIGHT = 0.9;
export const RESTORE_WEIGHT = 0.1;

/** Shares of a single update, summing to 1. */
export const OSU_WEIGHT = 0.6;
export const FLASH_WEIGHT = 0.3;
export const FINAL_WEIGHT = 0.1;

/**
 * The flash loop has no known length, so its term approaches 1 without reaching it.
 * `1 - FLASH_DECAY ** n` consumes 60% of the distance still left at each pass.
 */
export const FLASH_DECAY = 0.4;
