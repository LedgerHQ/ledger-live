import type { LkrpIdentityProviderStore } from "@ledgerhq/ledger-key-ring-protocol";
import { Session } from "../session/session-store";
import { getOrCreateMemberCredentials } from "./member-credentials";
import { resolveWrappingKey } from "./load-key-ring";

export async function loadWalletCliTrustchainStore(): Promise<LkrpIdentityProviderStore> {
  const session = await Session.read();
  const wrappingKey = await resolveWrappingKey(session);
  const memberCredentials = await getOrCreateMemberCredentials({
    wrappingKey,
    createMemberCredentials: session.trustchain
      ? () => {
          throw new Error(
            "Member credentials not found in the OS keychain. Run `wallet-cli ring destroy` then `wallet-cli ring init` to reset.",
          );
        }
      : undefined,
  });

  return {
    trustchain: session.trustchain ? { rootId: session.trustchain.rootId } : null,
    memberCredentials,
  };
}
