import type { MemberCredentials, Trustchain } from "@ledgerhq/ledger-key-ring-protocol/types";
import { Session, type TrustchainMeta, trustchainFromMeta } from "../session/session-store";
import { loadMemberCredentials } from "./keychain";
import { createLkrpSdk } from "./lkrp-sdk";
import { deriveDomainKey, deriveWrappingKey } from "./crypto";
import { promptHidden } from "./prompt";
import { writeStderr } from "../shared/ui";

export type LoadedKeyRing = {
  session: Session;
  trustchainMeta: TrustchainMeta;
  memberCredentials: MemberCredentials;
};

export async function loadKeyRing(
  wrappingKey?: CryptoKey,
  preloadedSession?: Session,
): Promise<LoadedKeyRing> {
  const session = preloadedSession ?? (await Session.read());
  const trustchainMeta = session.trustchain;
  // Check the trustchain before the keychain: an uninitialized ring would otherwise throw a
  // misleading password error instead of this clear "not initialized" guidance.
  if (!trustchainMeta) {
    throw new Error("Ledger Key Ring not initialized. Run `wallet-cli ring init` first.");
  }
  const memberCredentials = await loadMemberCredentials(wrappingKey);
  if (!memberCredentials) {
    throw new Error(
      "Member credentials not found in the OS keychain. Run `wallet-cli ring destroy` then `wallet-cli ring init` to reset.",
    );
  }
  return { session, trustchainMeta, memberCredentials };
}

export async function resolveWrappingKey(session: Session): Promise<CryptoKey | undefined> {
  if (!session.passwordSalt) return undefined;
  const { value: password } = await promptHidden("Password: ");
  if (!password) throw new Error("Password must not be empty.");
  return deriveWrappingKey(password, session.passwordSalt);
}

export async function loadDomainKey(
  domain: string,
  wrappingKey?: CryptoKey,
  preloadedSession?: Session,
): Promise<{ session: Session; domainKey: CryptoKey }> {
  const { session, trustchainMeta, memberCredentials } = await loadKeyRing(
    wrappingKey,
    preloadedSession,
  );
  const sdk = createLkrpSdk();
  let restored: Trustchain;
  try {
    restored = await sdk.restoreTrustchain(trustchainFromMeta(trustchainMeta), memberCredentials);
  } catch (e) {
    // The wallet-cli application stream was closed (deactivated from another device, or this member
    // was removed): restoreTrustchain rejects a closed stream with TrustchainEjected. Point the user
    // at the recovery path rather than surfacing the raw protocol error.
    if (e?.name === "TrustchainEjected") {
      throw new Error(
        "The wallet-cli application is no longer active on this Ledger Key Ring (deactivated " +
          "elsewhere, or this member was removed). Run `wallet-cli ring destroy` then " +
          "`wallet-cli ring init` to reactivate.",
        { cause: e },
      );
    }
    throw e;
  }
  if (restored.applicationPath !== trustchainMeta.applicationPath) {
    // The ring rotated (e.g. a member was removed), changing the encryption key: warn loudly since
    // data encrypted before the rotation can no longer be decrypted from the new application path.
    writeStderr(
      "⚠ Ledger Key Ring rotated since last use — data encrypted before the rotation may no longer be decryptable.\n",
    );
    session.setTrustchain({
      rootId: trustchainMeta.rootId,
      applicationPath: restored.applicationPath,
    });
    session.write();
  }
  return { session, domainKey: await deriveDomainKey(restored.walletSyncEncryptionKey, domain) };
}
