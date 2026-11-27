import type { IdentityProvider } from "@ledgerhq/auth";
import { selectKeyRingSecrets } from "@domain/entity-key-ring";
import { LkrpIdentityProvider } from "@ledgerhq/ledger-key-ring-protocol";
import type { KeyRingSession } from "../../types";
import { stateOf } from "../handles";
import type { V1KeyStore } from "./sliceKeyStore";

/**
 * The v1 identity provider: `LkrpIdentityProvider` signs with the raw member key, which only the
 * v1 key store hands out.
 */
export function createV1IdentityProvider(
  keyStore: V1KeyStore,
  readSession: () => KeyRingSession,
): IdentityProvider {
  return new LkrpIdentityProvider(() => ({
    trustchain: selectKeyRingSecrets({ trustchain: stateOf(readSession()) }).trustchain,
    memberCredentials: keyStore.memberCredentials(),
  }));
}
