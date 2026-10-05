import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import {
  createAgentRecoveryRequest,
  createAgentRecoveryUrl,
  formatAgentPublicKeyFingerprint,
  isAgentRecoverySource,
  SUPPORTED_AGENT_RECOVERY_SOURCES,
  AGENT_INTENT_FRONTEND_URLS,
  type AgentRecoverySource,
} from "@ledgerhq/agent-intent-sdk";
import { Session, withSessionLock, type AgentIntentProfileMeta } from "../../session/session-store";
import { loadProfileIdentity } from "../../agent-intent/profile-identity";
import { authenticateRecoveryCompletion } from "../../agent-intent/completion-auth";
import { outputOption, resolveOutputFormat } from "../inputs";
import { PROFILE_ID_RE, PROFILE_ID_MESSAGE } from "../../agent-intent/profile-format";
import {
  assertServiceUrl,
  assertStoredServiceUrl,
  createRelayHost,
  keycloakOverride,
  parseDurationMs,
  waitForRelayCompletion,
} from "../../agent-intent/relay";
import { createCommandOutput } from "../../output";

type EnrolledProfile = AgentIntentProfileMeta & {
  trustchainId: string;
  source: AgentRecoverySource;
};

function requireRecoverableProfile(session: Session, profileId: string): EnrolledProfile {
  const profile = session.getAgentIntentProfile(profileId);
  if (!profile) {
    if (session.invalidAgentIntentProfileIds.includes(profileId)) {
      throw new Error(
        `Agent Intent profile "${profileId}" failed to load (invalid session record) — fix the ` +
          "record in session.yaml before recovering it.",
      );
    }
    throw new Error(`No Agent Intent profile named "${profileId}".`);
  }
  const { trustchainId, source } = profile;
  if (!trustchainId) {
    throw new Error(
      `Agent Intent profile "${profileId}" has not completed enrollment, so there is nothing to ` +
        "recover — start a fresh `agent-intent enroll` instead.",
    );
  }
  if (!isAgentRecoverySource(source)) {
    throw new Error(
      `Agent Intent recovery supports only ${SUPPORTED_AGENT_RECOVERY_SOURCES.join(", ")} agents; ` +
        `profile "${profileId}" is a ${source} agent. Enroll a fresh profile under a new ` +
        "--profile id instead.",
    );
  }
  if (profile.keycloakBaseUrl !== undefined) {
    assertStoredServiceUrl(profileId, profile.keycloakBaseUrl, "keycloak-url", "Keycloak URL");
  }
  return { ...profile, trustchainId, source };
}

function isUnchanged(
  current: AgentIntentProfileMeta | undefined,
  profile: EnrolledProfile,
): current is EnrolledProfile {
  return current?.publicKey === profile.publicKey && current.trustchainId === profile.trustchainId;
}

/** Best effort: a marker left behind stops reading as "recovering" once it expires. */
function clearPendingRecovery(profile: EnrolledProfile, requestSignature: string): Promise<void> {
  return withSessionLock(async () => {
    const session = await Session.read();
    const current = session.getAgentIntentProfile(profile.profileId);
    if (current?.pendingRecovery?.requestSignature !== requestSignature) return;
    session.updateAgentIntentProfile(profile.profileId, { pendingRecovery: undefined });
    session.write();
  }).catch(() => undefined);
}

export default defineCommand({
  name: "recover",
  description:
    "Re-enroll an enrolled openclaw or hermes Agent Intent profile's existing key into its " +
    "previous Trustchain, and wait for the approval to be relayed back (no device required).",
  options: {
    profile: option(z.string().regex(PROFILE_ID_RE, PROFILE_ID_MESSAGE), {
      description: "Local id of the enrolled profile to recover.",
    }),
    "app-url": option(z.string().url().optional(), {
      description:
        "Agent Intent frontend origin used for the recovery handoff (default: the profile " +
        "environment's own frontend).",
    }),
    "expires-in": option(z.string().default("30m"), {
      description: "Recovery link validity: 45s, 30m, 2h, or 1d (default: 30m).",
    }),
    output: outputOption,
  },
  handler: async ({ flags }) => {
    const out = createCommandOutput(resolveOutputFormat(flags.output), {
      command: "agent-intent recover",
      network: "all",
      account: flags.profile,
    });
    await out.run(async () => {
      const expiresInMs = parseDurationMs(flags["expires-in"]);
      const profileId = flags.profile;
      const profile = requireRecoverableProfile(await Session.read(), profileId);
      const { environment } = profile;
      const appUrl = flags["app-url"] ?? AGENT_INTENT_FRONTEND_URLS[environment];
      assertServiceUrl(appUrl, "app-url");
      const identity = await loadProfileIdentity(profile);
      const expiresAt = new Date(Date.now() + expiresInMs).toISOString();

      const host = createRelayHost(environment, expiresInMs);
      try {
        const request = createAgentRecoveryRequest(identity, {
          name: profile.displayName,
          description: profile.description,
          source: profile.source,
          previousTrustchainId: profile.trustchainId,
          expiresAt,
          channel: host.binding,
        });
        const recoveryUrl = createAgentRecoveryUrl(appUrl, request);

        // A newer marker replaces an older one, so a still-running older `recover` refuses to persist.
        await withSessionLock(async () => {
          const session = await Session.read();
          if (!isUnchanged(session.getAgentIntentProfile(profileId), profile)) {
            throw new Error(
              `Agent Intent profile "${profileId}" changed while preparing the recovery; retry.`,
            );
          }
          session.updateAgentIntentProfile(profileId, {
            pendingRecovery: {
              previousTrustchainId: request.previousTrustchainId,
              requestSignature: request.signature,
              expiresAt,
            },
          });
          session.write();
        });

        out.agentIntentRecoveryPending({
          profileId,
          recoveryUrl,
          fingerprint: formatAgentPublicKeyFingerprint(identity.publicKey),
          expiresAt,
        });

        const completion = await waitForRelayCompletion(
          host,
          {
            request,
            authenticate: candidate =>
              authenticateRecoveryCompletion({
                completion: candidate,
                identity,
                environment,
                ...keycloakOverride(environment, profile.keycloakBaseUrl),
              }),
            persist: relayed =>
              withSessionLock(async () => {
                const session = await Session.read();
                const current = session.getAgentIntentProfile(profileId);
                if (
                  !isUnchanged(current, profile) ||
                  current.pendingRecovery?.requestSignature !== request.signature
                ) {
                  throw new Error(
                    `Agent Intent profile "${profileId}" was removed or changed while waiting for ` +
                      "approval; refusing to record the recovery.",
                  );
                }
                session.updateAgentIntentProfile(profileId, {
                  trustchainId: relayed.trustchainId,
                  pendingRecovery: undefined,
                });
                session.write();
              }),
          },
          "Recovery interrupted.",
        ).catch(async e => {
          await clearPendingRecovery(profile, request.signature);
          throw new Error(
            `Recovery did not complete (${e instanceof Error ? e.message : String(e)}). ` +
              `Profile "${profileId}" keeps its previous enrollment — run \`agent-intent recover\` ` +
              "again to retry.",
            { cause: e },
          );
        });

        out.agentIntentRecovered({ profileId, trustchainId: completion.trustchainId });
      } finally {
        host.close();
      }
    });
  },
});
