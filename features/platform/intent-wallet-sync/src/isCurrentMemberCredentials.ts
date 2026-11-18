import type { TrustchainStore } from "@ledgerhq/ledger-key-ring-protocol/store";
import type { MemberCredentials } from "@ledgerhq/ledger-key-ring-protocol/types";

/**
 * True when `runCredentials` are still the member credentials held in the store: no Ledger Sync
 * reset since the run started. A reset rotates them, so a late result of an older run belongs to a
 * Ledger Sync that is gone. Pass the state read when the result arrives.
 */
export function isCurrentMemberCredentials(
  state: Readonly<{ trustchain: Pick<TrustchainStore, "memberCredentials"> }>,
  runCredentials: MemberCredentials,
): boolean {
  return state.trustchain.memberCredentials?.pubkey === runCredentials.pubkey;
}
