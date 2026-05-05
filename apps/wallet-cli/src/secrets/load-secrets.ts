import type { MemberCredentials } from "@ledgerhq/ledger-key-ring-protocol/types";
import { Session, type TrustchainMeta, trustchainFromMeta } from "../session/session-store";
import { loadMemberCredentials } from "./keychain";
import { createLkrpSdk } from "./lkrp-sdk";
import { deriveDomainKey, deriveWrappingKey } from "./crypto";
import { promptHidden } from "./prompt";

export type LoadedSecrets = {
  session: Session;
  trustchainMeta: TrustchainMeta;
  memberCredentials: MemberCredentials;
};

export async function loadSecrets(wrappingKey?: CryptoKey): Promise<LoadedSecrets> {
  const [session, memberCredentials] = await Promise.all([
    Session.read(),
    loadMemberCredentials(wrappingKey),
  ]);
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

async function resolveWrappingKey(session: Session): Promise<CryptoKey | undefined> {
  if (!session.passwordSalt) return undefined;
  const password = await promptHidden("Password: ");
  if (!password) throw new Error("Password must not be empty.");
  return deriveWrappingKey(password, session.passwordSalt);
}

export async function loadDomainKey(domain: string, wrappingKey?: CryptoKey): Promise<{ session: Session; domainKey: CryptoKey }> {
  const { session, trustchainMeta, memberCredentials } = await loadSecrets(wrappingKey);
  const sdk = createLkrpSdk();
  const restored = await sdk.restoreTrustchain(trustchainFromMeta(trustchainMeta), memberCredentials);
  if (restored.applicationPath !== trustchainMeta.applicationPath) {
    session.setTrustchain({ rootId: trustchainMeta.rootId, applicationPath: restored.applicationPath });
    await session.write();
  }
  return { session, domainKey: await deriveDomainKey(restored.walletSyncEncryptionKey, domain) };
}

export async function loadDomainKeyInteractive(domain: string): Promise<{ session: Session; domainKey: CryptoKey }> {
  const session = await Session.read();
  const wrappingKey = await resolveWrappingKey(session);
  return loadDomainKey(domain, wrappingKey);
}
