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

// Checked in the handler rather than by a zod enum, so that `--cursor` refuses it like `--status`.
function parsePageSize(value: string | undefined): AgentIntentPageSize | undefined {
  if (value === undefined) return undefined;
  const size = AGENT_INTENT_PAGE_SIZES.find(candidate => String(candidate) === value);
  if (size === undefined) {
    throw new Error(`--page-size must be one of ${AGENT_INTENT_PAGE_SIZES.join(", ")}.`);
  }
  return size;
}

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
    "page-size": option(z.string().min(1).optional(), {
      description: `Intents per page: ${AGENT_INTENT_PAGE_SIZES.join(", ")} (default: the service's, 10).`,
    }),
    cursor: option(z.string().min(1).optional(), {
      description:
        "Continue from a previous page's next cursor, with that listing's filters and page size " +
        "(--status and --page-size are refused).",
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
      // The service applies the cursor's own filters, so new ones would be silently dropped.
      if (flags.cursor && (flags.status !== undefined || flags["page-size"] !== undefined)) {
        throw new Error(
          "--cursor continues with the filters and page size of the listing that returned it: drop --status and --page-size.",
        );
      }
      const status = parseStatusFilter(flags.status);
      const pageSize = parsePageSize(flags["page-size"]);
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
        page = await client.listIntents({ status, pageSize, cursor: flags.cursor });
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
