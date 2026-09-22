import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import {
  createAgentEnrollmentRequest,
  createAgentEnrollmentUrl,
  createSoftwareAgentIdentity,
  formatAgentPublicKeyFingerprint,
  SUPPORTED_AGENT_SOURCES,
  AGENT_INTENT_FRONTEND_URLS,
} from "@ledgerhq/agent-intent-sdk";
import { Session, AGENT_INTENT_ENVIRONMENTS } from "../../session/session-store";
import {
  hasAgentIntentSecretKey,
  saveAgentIntentSecretKey,
  deleteAgentIntentSecretKey,
} from "../../key-ring/agent-intent-keychain";
import { outputOption, resolveOutputFormat } from "../inputs";
import { PROFILE_ID_RE, PROFILE_ID_MESSAGE } from "../../agent-intent/profile-format";
import { createCommandOutput } from "../../output";

// Verified against agent-intent-frontend's argocd/{stg,prd}/values.yaml BFF_BASE_URL (2026-09-22),
// same host/path the reference agent-intent.mjs CLI defaults to. The SDK has no default of its own
// for bffBaseUrl (unlike AGENT_INTENT_FRONTEND_URLS for the app URL), so this stays local.
const DEFAULT_BFF_BASE_URLS = {
  staging: "https://global.api.stg.ledger-test.com/agent-intent",
  production: "https://global.api.prd.ledger.com/agent-intent",
} as const;

const DURATION_RE = /^([1-9]\d*)(s|m|h|d)$/;
const DURATION_UNITS_MS = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 } as const;
const MAX_DURATION_MS = 30 * DURATION_UNITS_MS.d;

function isDurationUnit(value: string): value is keyof typeof DURATION_UNITS_MS {
  return value in DURATION_UNITS_MS;
}

/** Parses `--expires-in` (e.g. 45s, 30m, 2h, 1d) into milliseconds. Rejects `0` (an already-expired
 * link) and anything past 30 days (an unreasonable validity window, and large enough values overflow
 * `Date`/`toISOString()` with a cryptic `RangeError`). */
function parseDurationMs(value: string): number {
  const match = DURATION_RE.exec(value);
  const unit = match?.[2];
  if (!match || !unit || !isDurationUnit(unit)) {
    throw new Error(`--expires-in "${value}" is invalid; use e.g. 45s, 30m, 2h, or 1d.`);
  }
  const ms = Number(match[1]) * DURATION_UNITS_MS[unit];
  if (ms > MAX_DURATION_MS) {
    throw new Error(`--expires-in "${value}" is too long; the maximum is 30d.`);
  }
  return ms;
}

export default defineCommand({
  name: "enroll",
  description:
    "Create a new Agent Intent profile and print its signed enrollment URL (no device required).",
  options: {
    profile: option(z.string().regex(PROFILE_ID_RE, PROFILE_ID_MESSAGE), {
      description: "Local profile id used to store and reference this agent's credentials.",
    }),
    name: option(z.string().min(1).max(80), {
      description: "Agent display name shown to the human reviewer, 1-80 characters.",
    }),
    description: option(
      z.string().min(1).max(280).default("Remote agent that proposes intents for review."),
      { description: "Agent description shown to the human reviewer, 1-280 characters." },
    ),
    source: option(z.enum(SUPPORTED_AGENT_SOURCES).default("openclaw"), {
      description: "Declared agent source.",
    }),
    "app-url": option(z.string().url().optional(), {
      description:
        "Agent Intent frontend origin used for the enrollment handoff (default: the " +
        "environment's own frontend).",
    }),
    "expires-in": option(z.string().default("30m"), {
      description: "Enrollment link validity: 45s, 30m, 2h, or 1d (default: 30m).",
    }),
    environment: option(z.enum(AGENT_INTENT_ENVIRONMENTS).default("staging"), {
      description: "Agent Intent environment.",
    }),
    "bff-url": option(z.string().url().optional(), {
      description: "Override the environment's default Agent Intent service base URL.",
    }),
    output: outputOption,
  },
  handler: async ({ flags }) => {
    const out = createCommandOutput(resolveOutputFormat(flags.output), {
      command: "agent-intent enroll",
      network: "all",
    });
    await out.run(async () => {
      const expiresInMs = parseDurationMs(flags["expires-in"]);

      const session = await Session.read();
      if (session.getAgentIntentProfile(flags.profile)) {
        throw new Error(
          `Agent Intent profile "${flags.profile}" already exists. Choose a different --profile id, ` +
            `or run \`wallet-cli agent-intent show --profile ${flags.profile}\`.`,
        );
      }
      if (hasAgentIntentSecretKey(flags.profile)) {
        throw new Error(
          `A keychain entry for profile "${flags.profile}" already exists but is not recorded in the ` +
            "session. Remove it manually (or choose a different --profile id) before re-enrolling.",
        );
      }

      const bffBaseUrl = flags["bff-url"] ?? DEFAULT_BFF_BASE_URLS[flags.environment];
      const appUrl = flags["app-url"] ?? AGENT_INTENT_FRONTEND_URLS[flags.environment];
      const enrollmentExpiresAt = new Date(Date.now() + expiresInMs).toISOString();

      const identity = createSoftwareAgentIdentity();
      const request = createAgentEnrollmentRequest(identity, {
        name: flags.name,
        description: flags.description,
        source: flags.source,
        expiresAt: enrollmentExpiresAt,
      });

      await saveAgentIntentSecretKey(flags.profile, identity.exportSecretKey());
      try {
        session.addAgentIntentProfile({
          profileId: flags.profile,
          displayName: flags.name,
          description: flags.description,
          source: flags.source,
          environment: flags.environment,
          bffBaseUrl,
          publicKey: identity.publicKey,
          enrollmentExpiresAt,
          createdAt: new Date().toISOString(),
        });
        session.write();
      } catch (e) {
        // Undo the keychain write so a retry doesn't hit "keychain entry exists but isn't recorded
        // in the session" — this is the only place that failure can originate from.
        deleteAgentIntentSecretKey(flags.profile);
        throw e;
      }

      out.agentIntentEnroll({
        profileId: flags.profile,
        enrollmentUrl: createAgentEnrollmentUrl(appUrl, request),
        fingerprint: formatAgentPublicKeyFingerprint(identity.publicKey),
      });
    });
  },
});
