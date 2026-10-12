import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import {
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
  isHttpError,
} from "../../agent-intent/service-errors";
import { parseIntentId, toIntentListEntry } from "../../agent-intent/intent-list";
import { askToConfirm, canAskToConfirm } from "../../agent-intent/confirm-prompt";
import { findEthereumToken } from "../../agent-intent/token-lookup";
import { createCommandOutput, type CommandOutput } from "../../output";
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
      if (!flags.yes) assertCanConfirm();
      const client = createAgentIntentClient({
        bffBaseUrl: profile.bffBaseUrl,
        identity: await loadProfileIdentity(profile),
        trustchainId: profile.trustchainId,
        environment: profile.environment,
        ...keycloakOverride(profile.environment, profile.keycloakBaseUrl),
      });
      const { profileId } = profile;
      const read = () => readIntent(client, profileId, intentId);
      const reportCancelled = async (
        record: AgentIntentRecord,
        alreadyCancelled: boolean,
        readBack = true,
      ) =>
        out.agentIntentCancel({
          profileId,
          intent: await toIntentListEntry(record, findEthereumToken),
          alreadyCancelled,
          readBack,
        });

      const before = await read();
      if (before.status === "cancelled") return reportCancelled(before, true);
      assertCancellable(intentId, before.status);

      if (!flags.yes && !(await confirmCancel(out, profileId, before))) {
        out.agentIntentCancelAborted({ profileId, intentId });
        return;
      }

      const cancelledMeanwhile = await cancelOrExplain(client, read, profileId, intentId);
      if (cancelledMeanwhile) return reportCancelled(cancelledMeanwhile, true);

      const after = await readBack(read, before);
      await reportCancelled(after.record, false, after.readBack);
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

function assertCanConfirm(): void {
  if (!canAskToConfirm()) {
    throw new Error(
      "Cancelling an intent can't be undone, and there is no terminal to confirm it. " +
        "Re-run with --yes to cancel without a prompt.",
    );
  }
}

async function confirmCancel(
  out: CommandOutput,
  profileId: string,
  intent: AgentIntentRecord,
): Promise<boolean> {
  out.agentIntentCancelPreview({
    profileId,
    intent: await toIntentListEntry(intent, findEthereumToken),
  });
  return askToConfirm("Cancel this intent? This can't be undone. [y/N] ");
}

/** A state this version doesn't know may be cancellable on a newer service: it lets it decide. */
function assertCancellable(intentId: string, status: string): void {
  if (isAgentIntentStatus(status) && !CANCELLABLE_STATUSES.has(status)) {
    throw new Error(notCancellableMessage(intentId, status));
  }
}

/**
 * Cancels the intent, or explains why the service refused. Returns the intent when it turns out
 * to be cancelled already, by another process or a retry: the cancel is harmless to repeat.
 */
async function cancelOrExplain(
  client: AgentIntentClient,
  read: () => Promise<AgentIntentRecord>,
  profileId: string,
  intentId: string,
): Promise<AgentIntentRecord | undefined> {
  try {
    await client.cancelIntent(intentId);
    return undefined;
  } catch (e) {
    if (!isHttpError(e) || e.status !== 400) {
      throw describeAgentIntentCancelError(e, profileId, intentId);
    }
    // A bare 400 on an intent now cancelled, signed or final means it moved on meanwhile.
    const now = await read().catch(() => undefined);
    if (now?.status === "cancelled") return now;
    if (now) assertCancellable(intentId, now.status);
    throw describeAgentIntentCancelError(e, profileId, intentId);
  }
}

/** The service has cancelled it: a failed read now must not report the cancel as failed. */
async function readBack(
  read: () => Promise<AgentIntentRecord>,
  before: AgentIntentRecord,
): Promise<{ record: AgentIntentRecord; readBack: boolean }> {
  try {
    return { record: await read(), readBack: true };
  } catch {
    writeStderr("Cancelled, but its new state could not be read back.\n");
    return { record: { ...before, status: "cancelled" }, readBack: false };
  }
}

function notCancellableMessage(intentId: string, status: string): string {
  return (
    `Intent ${intentId} is ${status}, so it can't be cancelled: only a created or crafted intent ` +
    "can, before the user signs it. Run `agent-intent status` to follow it."
  );
}
