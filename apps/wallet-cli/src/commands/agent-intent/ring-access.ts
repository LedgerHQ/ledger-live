import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import {
  createAgentRingAccessRequest,
  createAgentRingAccessUrl,
  formatAgentPublicKeyFingerprint,
  isAgentEnrollmentRejectedError,
  AGENT_INTENT_FRONTEND_URLS,
} from "@ledgerhq/agent-intent-sdk";
import { Session, withSessionLock, type AgentIntentProfileMeta } from "../../session/session-store";
import {
  requireEnrolledProfile,
  type EnrolledAgentIntentProfile,
} from "../../agent-intent/enrolled-profile";
import { loadProfileIdentity } from "../../agent-intent/profile-identity";
import { loadOrCreateEncryptionIdentity } from "../../agent-intent/encryption-key";
import { authenticateRingAccessCompletion } from "../../agent-intent/completion-auth";
import { outputOption, resolveOutputFormat } from "../inputs";
import { PROFILE_ID_RE, PROFILE_ID_MESSAGE } from "../../agent-intent/profile-format";
import {
  assertServiceUrl,
  createRelayHost,
  parseDurationMs,
  waitForRelayCompletion,
} from "../../agent-intent/relay";
import {
  forgetDetachedRun,
  listenerArgs,
  RingAccessPendingLineSchema,
  withListenerLock,
} from "../../agent-intent/detach";
import { startDetachedListener, throwListenerError } from "../../agent-intent/detached-start";
import { CodedCommandError, createCommandOutput, type CommandOutput } from "../../output";
import { errMessage } from "../../shared/error-message";
import { walletCliDebug } from "../../shared/log";
import { writeStderr } from "../../shared/ui";

type RingAccessProfile = EnrolledAgentIntentProfile & { encryptionPublicKey: string };

function isUnchanged(
  current: AgentIntentProfileMeta | undefined,
  profile: RingAccessProfile,
): current is RingAccessProfile {
  return (
    current?.publicKey === profile.publicKey &&
    current.trustchainId === profile.trustchainId &&
    current.encryptionPublicKey?.toLowerCase() === profile.encryptionPublicKey.toLowerCase()
  );
}

function clearPendingRingAccess(profileId: string, requestSignature: string): Promise<void> {
  return withSessionLock(async () => {
    const session = await Session.read();
    const current = session.getAgentIntentProfile(profileId);
    if (current?.pendingRingAccess?.requestSignature !== requestSignature) return;
    session.updateAgentIntentProfile(profileId, { pendingRingAccess: undefined });
    session.write();
  }).catch(e => walletCliDebug("agent-intent: could not clear the pending ring access", e));
}

async function startDetachedRingAccess(
  flags: { profile: string; [flag: string]: unknown },
  out: CommandOutput,
): Promise<void> {
  const profileId = flags.profile;
  const args = listenerArgs(
    ["agent-intent", "ring-access"],
    ringAccessCommand.options ?? {},
    flags,
  );
  const { child, first, logPath } = await startDetachedListener(
    "ring-access",
    profileId,
    args,
    async () => {
      requireEnrolledProfile(await Session.read(), profileId);
    },
  );
  if (first === undefined) {
    if (child.pid === undefined) {
      throw new Error(`The ring access listener did not start. See ${logPath}.`);
    }
    out.agentIntentRingAccessWaiting({ profileId, listenerPid: child.pid, logPath });
    return;
  }
  const pending = RingAccessPendingLineSchema.safeParse(first);
  if (pending.success) {
    const { ringAccessUrl, fingerprint, expiresAt, keyStore } = pending.data;
    out.agentIntentRingAccessPending({
      profileId: pending.data.profileId,
      ringAccessUrl,
      fingerprint,
      expiresAt,
      keyStore,
      listenerPid: child.pid,
      logPath,
    });
    return;
  }
  throwListenerError(first);
  child.kill();
  throw new Error(
    `The ring access listener printed an unexpected first line and was stopped. See ${logPath}.`,
  );
}

async function requestRingAccess(
  flags: { profile: string; "app-url"?: string; "expires-in": string },
  out: CommandOutput,
): Promise<void> {
  const expiresInMs = parseDurationMs(flags["expires-in"]);
  const profileId = flags.profile;
  const enrolled = requireEnrolledProfile(await Session.read(), profileId);
  await forgetDetachedRun("ring-access", profileId);
  const { environment } = enrolled;
  const appUrl = flags["app-url"] ?? AGENT_INTENT_FRONTEND_URLS[environment];
  assertServiceUrl(appUrl, "app-url");
  const identity = await loadProfileIdentity(enrolled);
  const encryptionIdentity = await loadOrCreateEncryptionIdentity(enrolled);
  const profile: RingAccessProfile = {
    ...enrolled,
    encryptionPublicKey: encryptionIdentity.publicKey,
  };
  const expiresAt = new Date(Date.now() + expiresInMs).toISOString();

  const host = createRelayHost(environment, expiresInMs);
  let refusal: unknown;
  try {
    const request = createAgentRingAccessRequest(identity, {
      encryptionPublicKey: encryptionIdentity.publicKey,
      name: profile.displayName,
      description: profile.description,
      source: profile.source,
      trustchainId: profile.trustchainId,
      expiresAt,
      channel: host.binding,
    });
    const ringAccessUrl = createAgentRingAccessUrl(appUrl, request);

    await withSessionLock(async () => {
      const session = await Session.read();
      if (!isUnchanged(session.getAgentIntentProfile(profileId), profile)) {
        throw new Error(
          `Agent Intent profile "${profileId}" changed while preparing the ring access request; ` +
            "retry.",
        );
      }
      session.updateAgentIntentProfile(profileId, {
        pendingRingAccess: { requestSignature: request.signature, expiresAt },
      });
      session.write();
    });

    out.agentIntentRingAccessPending({
      profileId,
      ringAccessUrl,
      fingerprint: formatAgentPublicKeyFingerprint(identity.publicKey),
      expiresAt,
      keyStore: profile.keyStore,
    });

    const completion = await waitForRelayCompletion(
      host,
      {
        request,
        authenticate: async candidate => {
          try {
            await authenticateRingAccessCompletion({
              completion: candidate,
              encryptionIdentity,
              environment,
            });
          } catch (e) {
            refusal = e;
            writeStderr(`Ring access grant was refused: ${errMessage(e)}\n`);
            throw e;
          }
        },
        persist: relayed =>
          withSessionLock(async () => {
            const session = await Session.read();
            const current = session.getAgentIntentProfile(profileId);
            if (
              !isUnchanged(current, profile) ||
              current.pendingRingAccess?.requestSignature !== request.signature
            ) {
              throw new Error(
                `Agent Intent profile "${profileId}" was removed or changed while waiting for ` +
                  "approval; refusing to record the ring access outcome.",
              );
            }
            session.updateAgentIntentProfile(profileId, {
              pendingRingAccess: undefined,
              ringAccess: {
                environment: relayed.environment,
                trustchainId: relayed.trustchainId,
                applicationPath: relayed.applicationPath,
                encryptionPublicKey: relayed.encryptionPublicKey,
              },
            });
            session.write();
          }),
      },
      "Ring access interrupted.",
    ).catch(async e => {
      const declined = isAgentEnrollmentRejectedError(e);
      const code =
        refusal === undefined && Date.now() >= Date.parse(expiresAt)
          ? "ring_access_expired"
          : "ring_access_failed";
      const reason =
        refusal === undefined ? errMessage(e) : `the grant was refused: ${errMessage(refusal)}`;
      await clearPendingRingAccess(profileId, request.signature);
      if (declined) {
        throw new CodedCommandError(
          "ring_access_declined",
          `Ring access for profile "${profileId}" was declined in the Agent Intent app. If the ` +
            "human did not decline it, run `agent-intent ring-access` again: the profile keeps " +
            "its encryption key.",
        );
      }
      throw new CodedCommandError(
        code,
        `Ring access did not complete (${reason}). Profile "${profileId}" keeps its ` +
          "encryption key — run `agent-intent ring-access` again to retry.",
      );
    });

    out.agentIntentRingAccessGranted({
      profileId,
      environment: completion.environment,
      trustchainId: completion.trustchainId,
      applicationPath: completion.applicationPath,
      encryptionPublicKey: completion.encryptionPublicKey,
    });
  } finally {
    host.close();
  }
}

const ringAccessCommand = defineCommand({
  name: "ring-access",
  description:
    "Ask the human to add an enrolled Agent Intent profile's encryption key to their Ledger Key " +
    "Ring, print the signed link, and wait for the answer to be relayed back (no device required).",
  options: {
    profile: option(z.string().regex(PROFILE_ID_RE, PROFILE_ID_MESSAGE), {
      description: "Local id of the enrolled profile asking for Key Ring access.",
    }),
    "app-url": option(z.string().url().optional(), {
      description:
        "Agent Intent frontend origin used for the ring access handoff (default: the profile " +
        "environment's own frontend).",
    }),
    "expires-in": option(z.string().default("30m"), {
      description: "Ring access link validity: 45s, 30m, 2h, or 1d (default: 30m).",
    }),
    detach: option(z.boolean().default(false), {
      description:
        "Run the approval wait as a background listener: print the ring access link and exit, " +
        "then check on it with `agent-intent wait`.",
      argumentKind: "flag",
    }),
    output: outputOption,
  },
  handler: async ({ flags }) => {
    const out = createCommandOutput(resolveOutputFormat(flags.output), {
      command: "agent-intent ring-access",
      network: "all",
      account: flags.profile,
    });
    await out.run(async () => {
      if (flags.detach) {
        await startDetachedRingAccess(flags, out);
        return;
      }
      await withListenerLock("ring-access", flags.profile, () => requestRingAccess(flags, out));
    });
  },
});

export default ringAccessCommand;
