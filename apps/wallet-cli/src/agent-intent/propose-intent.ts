import { option } from "@bunli/core";
import { z } from "zod";
import { createAgentIntentClient, type AgentIntentClient } from "@ledgerhq/agent-intent-sdk";
import { outputOption } from "../commands/inputs";
import { writeStderr } from "../shared/ui";
import type { EnrolledAgentIntentProfile } from "./enrolled-profile";
import { PROFILE_ID_MESSAGE, PROFILE_ID_RE } from "./profile-format";
import { loadProfileIdentity } from "./profile-identity";
import { keycloakOverride } from "./relay";
import { intentIdFromDeeplink } from "./send-intent";
import { describeAgentIntentError, isAcceptedWithoutReviewLink } from "./service-errors";

/** Options every `agent-intent` proposal command (`send`, `swap`) takes. */
export const proposalOptions = {
  profile: option(z.string().regex(PROFILE_ID_RE, PROFILE_ID_MESSAGE), {
    description: "Enrolled Agent Intent profile that proposes the intent.",
  }),
  account: option(z.string().min(1).optional(), {
    description: "Sender as a session label (Ethereum mainnet account), instead of an address.",
    short: "a",
  }),
  description: option(z.string().min(1).max(280).optional(), {
    description: "Note shown to the human reviewer, 1-280 characters.",
  }),
  output: outputOption,
};

/** Runs the SDK's own encoding (description length after NFC normalization, TLV) without a key
 * or network, so `--dry-run` rejects exactly what a real submit would. */
export function assertSdkAcceptsIntent(encode: () => unknown): void {
  try {
    encode();
  } catch (e) {
    throw new Error(`Invalid intent: ${e instanceof Error ? e.message : String(e)}`, { cause: e });
  }
}

export type SubmittedIntent = { deeplink: string | null; intentId: string | null };

/**
 * Signs in with the profile's own key and submits one intent. A 2xx without a readable review
 * link still counts as submitted: the intent exists, and failing would invite a duplicate retry.
 */
export async function submitAgentIntent(
  profile: EnrolledAgentIntentProfile,
  submit: (client: AgentIntentClient) => Promise<string>,
): Promise<SubmittedIntent> {
  const client = createAgentIntentClient({
    bffBaseUrl: profile.bffBaseUrl,
    identity: await loadProfileIdentity(profile),
    trustchainId: profile.trustchainId,
    environment: profile.environment,
    ...keycloakOverride(profile.environment, profile.keycloakBaseUrl),
  });

  let deeplink: string | null;
  try {
    deeplink = await submit(client);
  } catch (e) {
    if (!isAcceptedWithoutReviewLink(e)) throw describeAgentIntentError(e, profile.profileId);
    deeplink = null;
  }
  return { deeplink, intentId: deeplink ? intentIdFromDeeplink(deeplink) : null };
}

/** Warns, after the result is printed, when the created intent can't be found from it. */
export function warnIfReviewLinkUnusable({ deeplink, intentId }: SubmittedIntent): void {
  if (!deeplink) {
    writeStderr(
      "⚠ The Agent Intent service accepted the intent but returned no readable review link. " +
        "Find it in the Agent Intent frontend — don't re-run, or you'll propose a duplicate.\n",
    );
  } else if (!intentId) {
    writeStderr(
      "⚠ The review link has an unexpected shape, so no intent id could be extracted. " +
        "The intent was created — use the review link to find it.\n",
    );
  }
}
