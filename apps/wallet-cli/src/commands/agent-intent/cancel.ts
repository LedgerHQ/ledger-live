import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import {
  AgentIntentHttpError,
  createAgentIntentClient,
  isAgentIntentStatus,
  type AgentIntentClient,
  type AgentIntentRecord,
} from "@ledgerhq/agent-intent-sdk";
import { Session } from "../../session/session-store";
import { outputOption, resolveOutputFormat } from "../inputs";
import { PROFILE_ID_RE, PROFILE_ID_MESSAGE } from "../../agent-intent/profile-format";
import { requireEnrolledProfile } from "../../agent-intent/enrolled-profile";
import { loadProfileIdentity } from "../../agent-intent/profile-identity";
import { keycloakOverride } from "../../agent-intent/relay";
import {
  describeAgentIntentCancelError,
  describeAgentIntentLookupError,
} from "../../agent-intent/service-errors";
import { parseIntentId, toIntentListEntry } from "../../agent-intent/intent-list";
import { askToConfirm, canAskToConfirm } from "../../agent-intent/confirm-prompt";
import { findEthereumToken } from "../../agent-intent/token-lookup";
import { createCommandOutput } from "../../output";
import { writeStderr } from "../../shared/ui";

/** States the service lets the agent cancel: before the user signs. */
const CANCELLABLE_STATUSES: ReadonlySet<string> = new Set(["created", "crafted"]);

export default defineCommand({
  name: "cancel",
  description:
    "Cancel an intent an enrolled Agent Intent profile proposed, before the user signs it " +
    "(irreversible; no device required).",
  options: {
    profile: option(z.string().regex(PROFILE_ID_RE, PROFILE_ID_MESSAGE), {
      description: "Local id of the enrolled profile that proposed the intent.",
    }),
    intent: option(z.string().min(1), {
      description: "Intent id, as printed by `agent-intent send` or `agent-intent intents`.",
    }),
    yes: option(z.boolean().default(false), {
      description:
        "Cancel without asking for confirmation. Required when no one can answer a prompt " +
        "(scripts, AI agents, piped input).",
      argumentKind: "flag",
    }),
    output: outputOption,
  },
  handler: async ({ flags }) => {
    const out = createCommandOutput(resolveOutputFormat(flags.output), {
      command: "agent-intent cancel",
      network: "all",
      account: flags.profile,
    });
    await out.run(async () => {
      const intentId = parseIntentId(flags.intent);
      const profile = requireEnrolledProfile(await Session.read(), flags.profile);
      if (!flags.yes && !canAskToConfirm()) {
        throw new Error(
          "Cancelling an intent can't be undone, and there is no terminal to confirm it. " +
            "Re-run with --yes to cancel without a prompt.",
        );
      }
      const client = createAgentIntentClient({
        bffBaseUrl: profile.bffBaseUrl,
        identity: await loadProfileIdentity(profile),
        trustchainId: profile.trustchainId,
        environment: profile.environment,
        ...keycloakOverride(profile.environment, profile.keycloakBaseUrl),
      });
      const read = () => readIntent(client, profile.profileId, intentId);

      const before = await read();
      if (before.status === "cancelled") {
        out.agentIntentCancel({
          profileId: profile.profileId,
          intent: await toIntentListEntry(before, findEthereumToken),
          alreadyCancelled: true,
        });
        return;
      }
      // A state this version doesn't know may be cancellable on a newer service: let it decide.
      if (isAgentIntentStatus(before.status) && !CANCELLABLE_STATUSES.has(before.status)) {
        throw new Error(notCancellableMessage(intentId, before.status));
      }

      if (!flags.yes) {
        out.agentIntentCancelPreview({
          profileId: profile.profileId,
          intent: await toIntentListEntry(before, findEthereumToken),
        });
        if (!(await askToConfirm("Cancel this intent? This can't be undone. [y/N] "))) {
          out.agentIntentCancelAborted({ profileId: profile.profileId, intentId });
          return;
        }
      }

      try {
        await client.cancelIntent(intentId);
      } catch (e) {
        if (e instanceof AgentIntentHttpError && e.status === 400) {
          // Most likely the user signed it since it was read: report its state now. The service
          // sends no error type for this, so a still cancellable intent means another refusal.
          const now = await read().catch(() => undefined);
          if (now && now.status !== "cancelled" && !CANCELLABLE_STATUSES.has(now.status)) {
            throw new Error(notCancellableMessage(intentId, now.status));
          }
        }
        throw describeAgentIntentCancelError(e, profile.profileId, intentId);
      }

      // The service has cancelled it: a failed read now must not report the cancel as failed.
      const after = await read().catch(() => {
        writeStderr("Cancelled, but its new state could not be read back.\n");
        return { ...before, status: "cancelled" };
      });
      out.agentIntentCancel({
        profileId: profile.profileId,
        intent: await toIntentListEntry(after, findEthereumToken),
        alreadyCancelled: false,
      });
    });
  },
});

async function readIntent(
  client: AgentIntentClient,
  profileId: string,
  intentId: string,
): Promise<AgentIntentRecord> {
  try {
    return await client.getIntent(intentId);
  } catch (e) {
    throw describeAgentIntentLookupError(e, profileId, intentId);
  }
}

function notCancellableMessage(intentId: string, status: string): string {
  return (
    `Intent ${intentId} is ${status}, so it can't be cancelled: only a created or crafted intent ` +
    "can, before the user signs it. Run `agent-intent status` to follow it."
  );
}
