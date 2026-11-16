import {
  createSoftwareAgentIdentity,
  type SoftwareAgentIdentity,
} from "@ledgerhq/agent-intent-sdk";
import { Session, withSessionLock, type AgentIntentProfileMeta } from "../session/session-store";
import {
  deleteAgentIntentEncryptionKey,
  loadAgentIntentEncryptionKey,
  saveAgentIntentEncryptionKey,
} from "../key-ring/agent-intent-keychain";
import {
  agentIntentEncryptionKeyFilePath,
  deleteAgentIntentEncryptionKeyFile,
  loadAgentIntentEncryptionKeyFile,
  saveAgentIntentEncryptionKeyFile,
} from "../key-ring/agent-intent-key-file";
import { assertOsKeychainAvailable } from "../key-ring/keychain-entry";
import { errMessage } from "../shared/error-message";
import { writeStderr } from "../shared/ui";

type EncryptionKeyProfile = Pick<
  AgentIntentProfileMeta,
  "profileId" | "publicKey" | "keyStore" | "trustchainId" | "encryptionPublicKey"
>;

const KEYCHAIN_HINT = (profileId: string) =>
  `Profile "${profileId}" keeps its keys in the OS keychain: make the Secret Service reachable ` +
  "and re-run.";

const NEW_ENCRYPTION_KEY_HINT = (profileId: string) =>
  "To request Key Ring access with a new encryption key, remove `encryptionPublicKey` and " +
  `\`ringAccess\` from profile "${profileId}" in session.yaml, then run \`agent-intent ` +
  "ring-access` again.";

export async function loadOrCreateEncryptionIdentity(
  profile: EncryptionKeyProfile,
): Promise<SoftwareAgentIdentity> {
  const identity =
    profile.encryptionPublicKey === undefined
      ? await createEncryptionIdentity(profile)
      : await loadEncryptionIdentity({
          ...profile,
          encryptionPublicKey: profile.encryptionPublicKey,
        });
  if (profile.keyStore === "plaintext-file") {
    writeStderr(
      `⚠ Profile "${profile.profileId}" stores its encryption key unencrypted in ` +
        `${encryptionKeyFilePath(profile)}.\n`,
    );
  }
  return identity;
}

async function createEncryptionIdentity(
  profile: EncryptionKeyProfile,
): Promise<SoftwareAgentIdentity> {
  const stored = validIdentity(await readSecret(profile));
  const identity = stored ?? createSoftwareAgentIdentity();
  if (!stored) await saveEncryptionKey(profile, identity.exportSecretKey());
  try {
    await withSessionLock(async () => {
      const session = await Session.read();
      const current = session.getAgentIntentProfile(profile.profileId);
      if (
        current?.publicKey !== profile.publicKey ||
        current.trustchainId !== profile.trustchainId ||
        current.keyStore !== profile.keyStore ||
        current.encryptionPublicKey !== undefined
      ) {
        throw new Error(
          `Agent Intent profile "${profile.profileId}" changed while preparing its encryption ` +
            "key; retry.",
        );
      }
      session.updateAgentIntentProfile(profile.profileId, {
        encryptionPublicKey: identity.publicKey,
      });
      session.write();
    });
  } catch (e) {
    if (!stored) deleteEncryptionKey(profile);
    throw e;
  }
  return identity;
}

async function loadEncryptionIdentity(
  profile: EncryptionKeyProfile & { encryptionPublicKey: string },
): Promise<SoftwareAgentIdentity> {
  const { profileId } = profile;
  const secretKey = await readSecret(profile);
  if (!secretKey) {
    throw new Error(
      `The ${storeName(profile)} of profile "${profileId}" is missing. ` +
        NEW_ENCRYPTION_KEY_HINT(profileId),
    );
  }
  const identity = validIdentity(secretKey);
  if (!identity) {
    throw new Error(
      `The ${storeName(profile)} of profile "${profileId}" does not hold a valid key. ` +
        NEW_ENCRYPTION_KEY_HINT(profileId),
    );
  }
  if (identity.publicKey.toLowerCase() !== profile.encryptionPublicKey.toLowerCase()) {
    throw new Error(
      `The ${storeName(profile)} of profile "${profileId}" does not match its recorded ` +
        `encryption public key. ${NEW_ENCRYPTION_KEY_HINT(profileId)}`,
    );
  }
  return identity;
}

function validIdentity(secretKey: string | null): SoftwareAgentIdentity | undefined {
  if (!secretKey) return undefined;
  try {
    return createSoftwareAgentIdentity(secretKey);
  } catch {
    return undefined;
  }
}

function encryptionKeyFilePath(profile: EncryptionKeyProfile): string {
  return agentIntentEncryptionKeyFilePath(profile.profileId, profile.publicKey);
}

function storeName(profile: EncryptionKeyProfile): string {
  return profile.keyStore === "plaintext-file"
    ? `encryption key file ${encryptionKeyFilePath(profile)}`
    : "OS keychain encryption key";
}

function storeFailureHint(profile: EncryptionKeyProfile): string {
  return profile.keyStore === "plaintext-file" ? "" : " Unlock the OS keychain and re-run.";
}

async function readSecret(profile: EncryptionKeyProfile): Promise<string | null> {
  const { profileId, publicKey } = profile;
  const plaintext = profile.keyStore === "plaintext-file";
  if (!plaintext) assertOsKeychainAvailable(KEYCHAIN_HINT(profileId));
  try {
    return plaintext
      ? loadAgentIntentEncryptionKeyFile(profileId, publicKey)
      : await loadAgentIntentEncryptionKey(profileId, publicKey);
  } catch (e) {
    throw new Error(
      `Could not read the ${storeName(profile)} of profile "${profileId}" (${errMessage(e)}).` +
        storeFailureHint(profile),
      { cause: e },
    );
  }
}

async function saveEncryptionKey(profile: EncryptionKeyProfile, secretKey: string): Promise<void> {
  const { profileId, publicKey } = profile;
  try {
    if (profile.keyStore === "plaintext-file") {
      saveAgentIntentEncryptionKeyFile(profileId, publicKey, secretKey);
    } else {
      await saveAgentIntentEncryptionKey(profileId, publicKey, secretKey);
    }
  } catch (e) {
    throw new Error(
      `Could not store the encryption key of profile "${profileId}" (${errMessage(e)}). Nothing ` +
        `was saved.${storeFailureHint(profile)}`,
      { cause: e },
    );
  }
}

function deleteEncryptionKey(profile: EncryptionKeyProfile): void {
  const { profileId, publicKey } = profile;
  if (profile.keyStore === "plaintext-file") {
    deleteAgentIntentEncryptionKeyFile(profileId, publicKey);
  } else {
    deleteAgentIntentEncryptionKey(profileId, publicKey);
  }
}
