import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import {
  parseAgentEnrollmentCompletion,
  AGENT_ENROLLMENT_WITH_ACCOUNT_ACCESS_VERSION,
} from "@ledgerhq/agent-intent-sdk";
import { Session, withSessionLock, type AgentIntentProfileMeta } from "../../session/session-store";
import { outputOption, resolveOutputFormat } from "../inputs";
import { PROFILE_ID_RE, PROFILE_ID_MESSAGE } from "../../agent-intent/profile-format";
import { createCommandOutput } from "../../output";

/** Checked once (fast) before blocking on stdin — a stale `--profile` must fail fast rather than
 * hang waiting for a payload that will never help — and again (authoritative, against a fresh read)
 * inside the lock right before writing. */
function assertCompletableProfile(session: Session, profileId: string): AgentIntentProfileMeta {
  const profile = session.getAgentIntentProfile(profileId);
  if (!profile) {
    throw new Error(
      `No Agent Intent profile named "${profileId}". Run \`wallet-cli agent-intent enroll ` +
        `--profile ${profileId} ...\` first.`,
    );
  }
  if (profile.trustchainId) {
    throw new Error(
      `Agent Intent profile "${profileId}" is already enrolled (Trustchain ID: ` +
        `${profile.trustchainId}).`,
    );
  }
  return profile;
}

export default defineCommand({
  name: "complete",
  description:
    "Validate the completion JSON from the Agent Intent frontend and save its Trustchain ID.",
  options: {
    profile: option(z.string().regex(PROFILE_ID_RE, PROFILE_ID_MESSAGE), {
      description: "Local profile id, as passed to `agent-intent enroll --profile`.",
    }),
    payload: option(z.string().optional(), {
      description: "Completion JSON from the frontend. Reads stdin when omitted.",
    }),
    output: outputOption,
  },
  handler: async ({ flags }) => {
    const out = createCommandOutput(resolveOutputFormat(flags.output), {
      command: "agent-intent complete",
      network: "all",
    });
    await out.run(async () => {
      if (!flags.payload && process.stdin.isTTY) {
        throw new Error("No completion JSON: pass --payload '<json>' or pipe it to stdin.");
      }

      // Fast, unlocked precheck — see assertCompletableProfile's doc comment.
      assertCompletableProfile(await Session.read(), flags.profile);

      const payload = (flags.payload ?? (await Bun.stdin.text())).trim();
      if (!payload) {
        throw new Error("Completion JSON is empty. Pass --payload '<json>' or pipe it to stdin.");
      }

      const result = await withSessionLock(async () => {
        const session = await Session.read();
        const profile = assertCompletableProfile(session, flags.profile);

        const completion = parseAgentEnrollmentCompletion(payload, profile.publicKey);
        if (
          completion.version === AGENT_ENROLLMENT_WITH_ACCOUNT_ACCESS_VERSION &&
          completion.accountAccess.environment !== profile.environment
        ) {
          throw new Error(
            `Completion is for the ${completion.accountAccess.environment} environment but profile ` +
              `"${flags.profile}" was enrolled against ${profile.environment}.`,
          );
        }

        session.updateAgentIntentProfile(flags.profile, { trustchainId: completion.trustchainId });
        session.write();
        return { profileId: flags.profile, trustchainId: completion.trustchainId };
      });

      out.agentIntentComplete(result);
    });
  },
});
