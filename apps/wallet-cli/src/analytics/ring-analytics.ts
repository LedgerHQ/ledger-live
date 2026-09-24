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

export async function trackRingInitStarted(p: {
  passwordProtected: boolean;
  usedCustomName: boolean;
}): Promise<void> {
  await track("ringinit_started", {
    page: INIT,
    passwordProtected: p.passwordProtected,
    usedCustomName: p.usedCustomName,
  });
}

export async function trackRingInitCompleted(p: { passwordProtected: boolean }): Promise<void> {
  await track("ringinit_completed", {
    page: INIT,
    passwordProtected: p.passwordProtected,
  });
}

export async function trackRingEncrypt(p: {
  inputSource: IoSource;
  outputDest: IoDest;
  newKey: boolean;
}): Promise<void> {
  await track("ring_encrypted", {
    page: ENCRYPT,
    inputSource: p.inputSource,
    outputDest: p.outputDest,
    newKey: p.newKey,
  });
}

export async function trackRingDecrypt(p: {
  inputSource: IoSource;
  outputDest: IoDest;
}): Promise<void> {
  await track("ring_decrypted", {
    page: DECRYPT,
    inputSource: p.inputSource,
    outputDest: p.outputDest,
  });
}

// Exception: ringkeys_viewed is kept as a track event (not a Page event) because it is an
// in-context impression rather than a new screen load. Documented exception to the *_viewed convention.
export async function trackRingKeysViewed(p: { keysCount: number }): Promise<void> {
  await track("ringkeys_viewed", {
    page: KEYS,
    keysCount: p.keysCount,
  });
}

export async function trackRingDestroyStarted(p: { passwordProtected: boolean }): Promise<void> {
  await track("ringdestroy_started", {
    page: DESTROY,
    passwordProtected: p.passwordProtected,
  });
}

export async function trackRingDestroyCompleted(p: {
  remoteSucceeded: boolean;
  trustchainDestroyed: boolean;
  localWiped: boolean;
  recoveryWipe: boolean;
}): Promise<void> {
  await track("ringdestroy_completed", {
    page: DESTROY,
    remoteSucceeded: p.remoteSucceeded,
    trustchainDestroyed: p.trustchainDestroyed,
    localWiped: p.localWiped,
    recoveryWipe: p.recoveryWipe,
  });
}

export async function trackRingDestroyCancelled(): Promise<void> {
  await track("ringdestroy_cancelled", { page: DESTROY });
}
