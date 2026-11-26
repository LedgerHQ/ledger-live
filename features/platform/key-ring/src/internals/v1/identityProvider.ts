import type { IdentityProvider } from "@ledgerhq/auth";
import { selectKeyRingSecrets } from "@domain/entity-key-ring";
import { LkrpIdentityProvider } from "@ledgerhq/ledger-key-ring-protocol";
import type { KeyRingSession } from "../../types";
import { stateOf } from "../handles";
import { createSliceKeyStore } from "./sliceKeyStore";

/** The v1 identity provider: `LkrpIdentityProvider` signs with the raw member key of the slice. */
export function createV1IdentityProvider(readSession: () => KeyRingSession): IdentityProvider {
  return new LkrpIdentityProvider(() => {
    const state = selectKeyRingSecrets({ trustchain: stateOf(readSession()) });
    return {
      trustchain: state.trustchain,
      memberCredentials: createSliceKeyStore(() => state).memberCredentials(),
    };
  });
}
