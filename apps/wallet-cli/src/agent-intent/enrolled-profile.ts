import type { AgentIntentProfileMeta, Session } from "../session/session-store";
import { assertStoredServiceUrl } from "./relay";

export type EnrolledAgentIntentProfile = AgentIntentProfileMeta & { trustchainId: string };

/** The named profile, enrolled, with its stored service URLs re-checked before any signed-in request. */
export function requireEnrolledProfile(
  session: Session,
  profileId: string,
): EnrolledAgentIntentProfile {
  const profile = session.getAgentIntentProfile(profileId);
  if (!profile) {
    throw new Error(
      `No Agent Intent profile named "${profileId}". Run \`wallet-cli agent-intent list\` to see ` +
        "your profiles, or `agent-intent enroll` to create one.",
    );
  }
  if (!profile.trustchainId) {
    throw new Error(
      `Agent Intent profile "${profileId}" is not enrolled yet — approve its \`agent-intent ` +
        "enroll` link first, or enroll a fresh profile if that link expired.",
    );
  }
  // Re-checked here: the signed-in request sends an access token to these hosts.
  assertStoredServiceUrl(profileId, profile.bffBaseUrl, "bff-url", "BFF URL");
  if (profile.keycloakBaseUrl !== undefined) {
    assertStoredServiceUrl(profileId, profile.keycloakBaseUrl, "keycloak-url", "Keycloak URL");
  }
  return { ...profile, trustchainId: profile.trustchainId };
}
