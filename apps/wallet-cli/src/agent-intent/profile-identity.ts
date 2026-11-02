import {
  createSoftwareAgentIdentity,
  type SoftwareAgentIdentity,
} from "@ledgerhq/agent-intent-sdk";
import type { AgentIntentProfileMeta } from "../session/session-store";
import { loadAgentIntentSecretKey } from "../key-ring/agent-intent-keychain";
import {
  agentIntentKeyFilePath,
  hasAgentIntentKeyFile,
  loadAgentIntentKeyFile,
} from "../key-ring/agent-intent-key-file";
import { assertOsKeychainAvailable } from "../key-ring/keychain-entry";
import { errMessage } from "../shared/error-message";
import { RE_ENROLL } from "./service-errors";
import { writeStderr } from "../shared/ui";

// A stored key that can never be read again: only a fresh enrollment gets the agent working.
const UNUSABLE_KEY_ERRORS = new Set([
  "AgentIntentPasswordRequiredError",
  "AgentIntentCorruptKeychainError",
]);

// Loads the profile's agent key from the store it was enrolled with and checks it against the
// recorded public key, so a key/session mix-up fails locally instead of as a remote auth error.
export async function loadProfileIdentity(
  profile: Pick<AgentIntentProfileMeta, "profileId" | "publicKey" | "keyStore">,
): Promise<SoftwareAgentIdentity> {
  const { profileId } = profile;
  const plaintext = profile.keyStore === "plaintext-file";
  const secretKey = plaintext ? loadKeyFromFile(profileId) : await loadKeyFromOsKeychain(profileId);
  let identity: SoftwareAgentIdentity;
  try {
    identity = createSoftwareAgentIdentity(secretKey);
  } catch (e) {
    if (!plaintext) throw e;
    // The SDK's message names what's wrong with the key, never the key itself.
    throw new Error(
      `The agent key file of profile "${profileId}" (${agentIntentKeyFilePath(profileId)}) does ` +
        `not hold a valid agent key (${errMessage(e)}). ${RE_ENROLL(profileId)}`,
      { cause: e },
    );
  }
  if (identity.publicKey.toLowerCase() !== profile.publicKey.toLowerCase()) {
    throw new Error(
      `The ${plaintext ? "agent key file" : "OS keychain key"} of profile "${profileId}" does ` +
        "not match its recorded public key.",
    );
  }
  return identity;
}

async function loadKeyFromOsKeychain(profileId: string): Promise<string> {
  // Points at the file but never falls back to it: only the human can confirm the profile's store.
  const keyFileHint = hasAgentIntentKeyFile(profileId)
    ? ` A plaintext agent key file exists at ${agentIntentKeyFilePath(profileId)}: if this ` +
      "profile was enrolled with --allow-plaintext-key (an older wallet-cli rewrote session.yaml " +
      "and dropped the field), set `keyStore: plaintext-file` for it in session.yaml."
    : "";
  assertOsKeychainAvailable(
    `Profile "${profileId}" can't be read here: its agent key is in the OS keychain. Make the ` +
      "Secret Service reachable and re-run (e.g. from the desktop session that enrolled the " +
      "profile, or with that session's D-Bus bus in DBUS_SESSION_BUS_ADDRESS). Only if a " +
      "wallet-cli that predates --allow-plaintext-key enrolled it on this machine without one " +
      "did the key go to the kernel keyring, which wallet-cli no longer reads: then that key " +
      `is gone. ${RE_ENROLL(profileId)} Pass ` +
      "--allow-plaintext-key only after the human explicitly agrees to store the agent key " +
      `unencrypted on this machine.${keyFileHint}`,
  );
  let secretKey: string | null;
  try {
    secretKey = await loadAgentIntentSecretKey(profileId);
  } catch (e) {
    const hint =
      e instanceof Error && UNUSABLE_KEY_ERRORS.has(e.name)
        ? ` ${RE_ENROLL(profileId)}`
        : " Unlock the OS keychain and re-run.";
    throw new Error(
      `Could not read the agent key of profile "${profileId}" from the OS keychain ` +
        `(${errMessage(e)}).${hint}`,
      { cause: e },
    );
  }
  if (!secretKey) {
    throw new Error(
      `No agent key found in the OS keychain for profile "${profileId}". Profiles don't move ` +
        `between machines or users. ${RE_ENROLL(profileId)}${keyFileHint}`,
    );
  }
  return secretKey;
}

function loadKeyFromFile(profileId: string): string {
  const path = agentIntentKeyFilePath(profileId);
  let secretKey: string | null;
  try {
    secretKey = loadAgentIntentKeyFile(profileId);
  } catch (e) {
    throw new Error(
      `Could not read the agent key file of profile "${profileId}" (${errMessage(e)}).`,
      { cause: e },
    );
  }
  if (secretKey === "") {
    throw new Error(
      `The agent key file of profile "${profileId}" (${path}) is empty. ${RE_ENROLL(profileId)}`,
    );
  }
  if (secretKey === null) {
    throw new Error(
      `No agent key file found for profile "${profileId}" at ${path}. Profiles don't move ` +
        `between machines or users. ${RE_ENROLL(profileId)}`,
    );
  }
  // stderr only, so JSON output on stdout is unchanged.
  writeStderr(`⚠ Profile "${profileId}" stores its agent key unencrypted in ${path}.\n`);
  return secretKey;
}
