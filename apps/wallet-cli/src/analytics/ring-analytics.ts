import { track } from "./segment";

// Ledger Key Ring analytics. Privacy contract: only booleans, enums, and counts are ever emitted —
// never key/domain names, member names, file paths, trustchain identifiers, salts, or payload bytes.

const INIT = "Ring - Init";
const ENCRYPT = "Ring - Encrypt";
const DECRYPT = "Ring - Decrypt";
const KEYS = "Ring - Keys";
const DESTROY = "Ring - Destroy";

type IoSource = "file" | "stdin";
type IoDest = "file" | "stdout";

export function trackRingInitStarted(p: {
  passwordProtected: boolean;
  usedCustomName: boolean;
}): void {
  track("ring_init_started", {
    page: INIT,
    passwordProtected: p.passwordProtected,
    usedCustomName: p.usedCustomName,
  });
}

export function trackRingInitCompleted(p: { passwordProtected: boolean }): void {
  track("ring_init_completed", {
    page: INIT,
    passwordProtected: p.passwordProtected,
  });
}

export function trackRingEncrypt(p: {
  inputSource: IoSource;
  outputDest: IoDest;
  newKey: boolean;
}): void {
  track("ring_encrypt", {
    page: ENCRYPT,
    inputSource: p.inputSource,
    outputDest: p.outputDest,
    newKey: p.newKey,
  });
}

export function trackRingDecrypt(p: { inputSource: IoSource; outputDest: IoDest }): void {
  track("ring_decrypt", {
    page: DECRYPT,
    inputSource: p.inputSource,
    outputDest: p.outputDest,
  });
}

export function trackRingKeysViewed(p: { keysCount: number }): void {
  track("ring_keys_viewed", {
    page: KEYS,
    keysCount: p.keysCount,
  });
}

export function trackRingDestroyStarted(p: { passwordProtected: boolean }): void {
  track("ring_destroy_started", {
    page: DESTROY,
    passwordProtected: p.passwordProtected,
  });
}

export function trackRingDestroyCompleted(p: {
  remoteSucceeded: boolean;
  trustchainDestroyed: boolean;
  localWiped: boolean;
  recoveryWipe: boolean;
}): void {
  track("ring_destroy_completed", {
    page: DESTROY,
    remoteSucceeded: p.remoteSucceeded,
    trustchainDestroyed: p.trustchainDestroyed,
    localWiped: p.localWiped,
    recoveryWipe: p.recoveryWipe,
  });
}

export function trackRingDestroyCancelled(): void {
  track("ring_destroy_cancelled", { page: DESTROY });
}
