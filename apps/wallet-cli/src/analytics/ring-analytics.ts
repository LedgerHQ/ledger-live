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
  track("ringinit_started", {
    page: INIT,
    passwordProtected: p.passwordProtected,
    usedCustomName: p.usedCustomName,
  });
}

export function trackRingInitCompleted(p: { passwordProtected: boolean }): void {
  track("ringinit_completed", {
    page: INIT,
    passwordProtected: p.passwordProtected,
  });
}

export function trackRingEncrypt(p: {
  inputSource: IoSource;
  outputDest: IoDest;
  newKey: boolean;
}): void {
  track("ring_encrypted", {
    page: ENCRYPT,
    inputSource: p.inputSource,
    outputDest: p.outputDest,
    newKey: p.newKey,
  });
}

export function trackRingDecrypt(p: { inputSource: IoSource; outputDest: IoDest }): void {
  track("ring_decrypted", {
    page: DECRYPT,
    inputSource: p.inputSource,
    outputDest: p.outputDest,
  });
}

// Exception: ringkeys_viewed is kept as a track event (not a Page event) because it is an
// in-context impression rather than a new screen load. Documented exception to the *_viewed convention.
export function trackRingKeysViewed(p: { keysCount: number }): void {
  track("ringkeys_viewed", {
    page: KEYS,
    keysCount: p.keysCount,
  });
}

export function trackRingDestroyStarted(p: { passwordProtected: boolean }): void {
  track("ringdestroy_started", {
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
  track("ringdestroy_completed", {
    page: DESTROY,
    remoteSucceeded: p.remoteSucceeded,
    trustchainDestroyed: p.trustchainDestroyed,
    localWiped: p.localWiped,
    recoveryWipe: p.recoveryWipe,
  });
}

export function trackRingDestroyCancelled(): void {
  track("ringdestroy_cancelled", { page: DESTROY });
}
