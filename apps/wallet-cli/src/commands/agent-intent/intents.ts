import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import {
  AGENT_INTENT_PAGE_SIZES,
  AGENT_INTENT_STATUSES,
  createAgentIntentClient,
  type AgentIntentPage,
  type AgentIntentPageSize,
} from "@ledgerhq/agent-intent-sdk";
import { Session } from "../../session/session-store";
import { outputOption, resolveOutputFormat } from "../inputs";
import { PROFILE_ID_RE, PROFILE_ID_MESSAGE } from "../../agent-intent/profile-format";
import { requireEnrolledProfile } from "../../agent-intent/enrolled-profile";
import { loadProfileIdentity } from "../../agent-intent/profile-identity";
import { keycloakOverride } from "../../agent-intent/relay";
import { describeAgentIntentListError } from "../../agent-intent/service-errors";
import { parseStatusFilter, toIntentListEntries } from "../../agent-intent/intent-list";
import { findEthereumToken } from "../../agent-intent/token-lookup";
import { createCommandOutput } from "../../output";

const PAGE_SIZES = AGENT_INTENT_PAGE_SIZES.map(String) as [string, ...string[]];

export default defineCommand({
  name: "intents",
  description:
    "List the intents an enrolled Agent Intent profile proposed, most recent first, one page at a " +
    "time (no device required).",
  options: {
    profile: option(z.string().regex(PROFILE_ID_RE, PROFILE_ID_MESSAGE), {
      description: "Local id of the enrolled profile whose intents to list.",
    }),
    status: option(z.string().min(1).optional(), {
      description: `Only intents in these states, comma-separated: ${AGENT_INTENT_STATUSES.join(", ")}.`,
    }),
    "page-size": option(z.enum(PAGE_SIZES).optional(), {
      description: `Intents per page: ${PAGE_SIZES.join(", ")} (default: the service's, 10).`,
    }),
    cursor: option(z.string().min(1).optional(), {
      description:
        "Continue from a previous page's next cursor; --status and --page-size are then ignored.",
    }),
    output: outputOption,
  },
  handler: async ({ flags }) => {
    const out = createCommandOutput(resolveOutputFormat(flags.output), {
      command: "agent-intent intents",
      network: "all",
      account: flags.profile,
    });
    await out.run(async () => {
      const status = parseStatusFilter(flags.status);
      const profile = requireEnrolledProfile(await Session.read(), flags.profile);
      const client = createAgentIntentClient({
        bffBaseUrl: profile.bffBaseUrl,
        identity: await loadProfileIdentity(profile),
        trustchainId: profile.trustchainId,
        environment: profile.environment,
        ...keycloakOverride(profile.environment, profile.keycloakBaseUrl),
      });

      let page: AgentIntentPage;
      try {
        page = await client.listIntents({
          status,
          pageSize: flags["page-size"]
            ? (Number(flags["page-size"]) as AgentIntentPageSize)
            : undefined,
          cursor: flags.cursor,
        });
      } catch (e) {
        throw describeAgentIntentListError(e, profile.profileId);
      }

      out.agentIntentIntents({
        profileId: profile.profileId,
        intents: await toIntentListEntries(page.intents, findEthereumToken),
        nextCursor: page.nextCursor ?? null,
      });
    });
  },
});
