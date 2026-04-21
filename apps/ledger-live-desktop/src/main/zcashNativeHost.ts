/**
 * Thin re-export of the ZCash main-process IPC host, which lives in the
 * `@ledgerhq/zcash-shielded` package so the utility protocol stays colocated
 * with the contract and the renderer client.
 *
 * Only kept here so `main/index.ts` doesn't need to be touched when the lib
 * reorganises its internals. Feel free to delete this shim and import
 * directly from `@ledgerhq/zcash-shielded/ipc/main-host` if you prefer.
 */

export {
  setupZcashNativeHost,
  cleanupZcashNativeHost,
} from "@ledgerhq/zcash-shielded/ipc/main-host";
