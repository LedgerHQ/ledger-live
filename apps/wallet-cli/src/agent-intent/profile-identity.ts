import {
  createSoftwareAgentIdentity,
  type SoftwareAgentIdentity,
} from "@ledgerhq/agent-intent-sdk";
import type { AgentIntentProfileMeta } from "../session/session-store";
import { loadAgentIntentSecretKey } from "../key-ring/agent-intent-keychain";
import { errMessage } from "../shared/error-message";

// A stored key that can never be read again: only a fresh enrollment gets the agent working.
const UNUSABLE_KEY_ERRORS = new Set([
  "AgentIntentPasswordRequiredError",
  "AgentIntentCorruptKeychainError",
]);

/** Loads the profile's agent key from the OS keychain and checks it against the recorded public
 * key, so a keychain/session mix-up fails locally instead of as a remote auth error. */
export async function loadProfileIdentity(
  profile: Pick<AgentIntentProfileMeta, "profileId" | "publicKey">,
): Promise<SoftwareAgentIdentity> {
  const { profileId } = profile;
  let secretKey: string | null;
  try {
    secretKey = await loadAgentIntentSecretKey(profileId);
  } catch (e) {
    const hint =
      e instanceof Error && UNUSABLE_KEY_ERRORS.has(e.name)
        ? " Re-enroll under a new --profile id."
        : "";
    throw new Error(
      `Could not read the agent key of profile "${profileId}" from the OS keychain ` +
        `(${errMessage(e)}).${hint}`,
      { cause: e },
    );
  }
  if (!secretKey) {
    throw new Error(
      `No agent key found in the OS keychain for profile "${profileId}". Profiles don't move ` +
        "between machines or users — enroll a fresh profile here.",
    );
  }
  const identity = createSoftwareAgentIdentity(secretKey);
  if (identity.publicKey.toLowerCase() !== profile.publicKey.toLowerCase()) {
    throw new Error(
      `The OS keychain key of profile "${profileId}" does not match its recorded public key.`,
    );
  }
  return identity;
}
