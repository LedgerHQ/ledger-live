import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import {
  parseAgentEnrollmentCompletion,
  AGENT_ENROLLMENT_WITH_ACCOUNT_ACCESS_VERSION,
} from "@ledgerhq/agent-intent-sdk";
import { Session } from "../../session/session-store";
import { outputOption, resolveOutputFormat } from "../inputs";
import { PROFILE_ID_RE, PROFILE_ID_MESSAGE } from "../../agent-intent/profile-format";
import { createCommandOutput } from "../../output";

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

      const session = await Session.read();
      const profile = session.getAgentIntentProfile(flags.profile);
      if (!profile) {
        throw new Error(
          `No Agent Intent profile named "${flags.profile}". Run \`wallet-cli agent-intent enroll ` +
            `--profile ${flags.profile} ...\` first.`,
        );
      }
      if (profile.trustchainId) {
        throw new Error(
          `Agent Intent profile "${flags.profile}" is already enrolled (Trustchain ID: ` +
            `${profile.trustchainId}).`,
        );
      }

      const payload = (flags.payload ?? (await Bun.stdin.text())).trim();
      if (!payload) {
        throw new Error("Completion JSON is empty. Pass --payload '<json>' or pipe it to stdin.");
      }

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

      out.agentIntentComplete({ profileId: flags.profile, trustchainId: completion.trustchainId });
    });
  },
});
