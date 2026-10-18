import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { createAgentIntentClient, type AgentIntentRecord } from "@ledgerhq/agent-intent-sdk";
import { Session } from "../../session/session-store";
import { outputOption, resolveOutputFormat } from "../inputs";
import { PROFILE_ID_RE, PROFILE_ID_MESSAGE } from "../../agent-intent/profile-format";
import { requireEnrolledProfile } from "../../agent-intent/enrolled-profile";
import { loadProfileIdentity } from "../../agent-intent/profile-identity";
import { keycloakOverride } from "../../agent-intent/relay";
import { describeAgentIntentLookupError } from "../../agent-intent/service-errors";
import {
  isTerminalIntentStatus,
  parseIntentId,
  toIntentListEntry,
} from "../../agent-intent/intent-list";
import { findEthereumToken } from "../../agent-intent/token-lookup";
import { createCommandOutput } from "../../output";

export default defineCommand({
  name: "status",
  description:
    "Show the current status and details of one intent an enrolled Agent Intent profile proposed " +
    "(no device required).",
  options: {
    profile: option(z.string().regex(PROFILE_ID_RE, PROFILE_ID_MESSAGE), {
      description: "Local id of the enrolled profile that proposed the intent.",
    }),
    intent: option(z.string().min(1), {
      description: "Intent id, as printed by `agent-intent send` or `agent-intent intents`.",
    }),
    output: outputOption,
  },
  handler: async ({ flags }) => {
    const out = createCommandOutput(resolveOutputFormat(flags.output), {
      command: "agent-intent status",
      network: "all",
      account: flags.profile,
    });
    await out.run(async () => {
      const intentId = parseIntentId(flags.intent);
      const profile = requireEnrolledProfile(await Session.read(), flags.profile);
      const client = createAgentIntentClient({
        bffBaseUrl: profile.bffBaseUrl,
        identity: await loadProfileIdentity(profile),
        trustchainId: profile.trustchainId,
        environment: profile.environment,
        ...keycloakOverride(profile.environment, profile.keycloakBaseUrl),
      });

      let record: AgentIntentRecord;
      try {
        record = await client.getIntent(intentId);
      } catch (e) {
        throw describeAgentIntentLookupError(e, profile.profileId, intentId);
      }

      out.agentIntentStatus({
        profileId: profile.profileId,
        intent: await toIntentListEntry(record, findEthereumToken),
        terminal: isTerminalIntentStatus(record.status),
      });
    });
  },
});
