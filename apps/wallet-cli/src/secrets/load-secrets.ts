import type { MemberCredentials } from "@ledgerhq/ledger-key-ring-protocol/types";
import { Session, type TrustchainMeta, trustchainFromMeta } from "../session/session-store";
import { loadMemberCredentials } from "./keychain";
import { createLkrpSdk } from "./lkrp-sdk";
import { deriveDomainKey } from "./crypto";

export type LoadedSecrets = {
  session: Session;
  trustchainMeta: TrustchainMeta;
  memberCredentials: MemberCredentials;
};

export async function loadSecrets(): Promise<LoadedSecrets> {
  const [session, memberCredentials] = await Promise.all([Session.read(), loadMemberCredentials()]);
  const trustchainMeta = session.trustchain;
  if (!trustchainMeta) {
    throw new Error("Encryption CLI not initialized. Run `wallet-cli secrets init` first.");
  }
  if (!memberCredentials) {
    throw new Error(
      "Private key not found in keychain. Run `wallet-cli secrets destroy` then `init` to reset.",
    );
  }
  return { session, trustchainMeta, memberCredentials };
}

export async function loadDomainKey(domain: string): Promise<{ session: Session; domainKey: CryptoKey }> {
  const { session, trustchainMeta, memberCredentials } = await loadSecrets();
  const sdk = createLkrpSdk();
  const restored = await sdk.restoreTrustchain(trustchainFromMeta(trustchainMeta), memberCredentials);
  if (restored.applicationPath !== trustchainMeta.applicationPath) {
    session.setTrustchain({ rootId: trustchainMeta.rootId, applicationPath: restored.applicationPath });
    await session.write();
  }
  return { session, domainKey: await deriveDomainKey(restored.walletSyncEncryptionKey, domain) };
}
