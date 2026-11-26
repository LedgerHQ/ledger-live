import {
  keyRingMemberKeySet,
  keyRingTreeSet,
  type KeyRingMemberKeyRecord,
  type KeyRingTreeRecord,
} from "@domain/entity-key-ring";
import { getSdk } from "@ledgerhq/ledger-key-ring-protocol/index";
import type { KeyRingDeviceBridge } from "./types";
import { LEDGER_SYNC_APPLICATION_ID } from "./internals/v1/constants";
import { v1BridgeOf } from "./internals/v1/deviceBridge";

/**
 * The raw protocol SDK for the Trustchain and Cloud Sync debug tools, which inspect and edit the
 * key tree itself. Debug screens only: features go through `KeyRingClient`. It runs no lifecycle,
 * so its rotations run no rotation handler.
 *
 * @example
 * ```ts
 * import { createKeyRingDebugSdk } from "@features/platform-key-ring/devtools";
 *
 * const sdk = createKeyRingDebugSdk({ apiBaseUrl: trustchainApiBaseUrl, deviceBridge });
 * ```
 */
export function createKeyRingDebugSdk({
  apiBaseUrl,
  deviceBridge,
}: Readonly<{ apiBaseUrl: string; deviceBridge: KeyRingDeviceBridge }>): KeyRingDebugSdk {
  return getSdk(
    false,
    { applicationId: LEDGER_SYNC_APPLICATION_ID, name: "DevTools", apiBaseUrl },
    v1BridgeOf(deviceBridge).withDevice,
  );
}

/** Stores the key tree the Trustchain debug tool established. Debug screens only. */
export function setDebugKeyRingTree(tree: KeyRingTreeRecord) {
  return keyRingTreeSet(tree);
}

/** Stores the member key the Trustchain debug tool established. Debug screens only. */
export function setDebugKeyRingMemberKey(memberKey: KeyRingMemberKeyRecord) {
  return keyRingMemberKeySet(memberKey);
}

/** The protocol SDK the debug tools drive, exactly as the protocol defines it. */
export type KeyRingDebugSdk = ReturnType<typeof getSdk>;
