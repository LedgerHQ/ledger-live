import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import {
  createAgentEnrollmentRequest,
  createAgentEnrollmentUrl,
  createSoftwareAgentIdentity,
  formatAgentPublicKeyFingerprint,
  SUPPORTED_AGENT_SOURCES,
} from "@ledgerhq/agent-intent-sdk";
import { Session, AGENT_INTENT_ENVIRONMENTS } from "../../session/session-store";
import {
  hasAgentIntentSecretKey,
  saveAgentIntentSecretKey,
} from "../../key-ring/agent-intent-keychain";
import { outputOption, resolveOutputFormat, PROFILE_ID_RE, PROFILE_ID_MESSAGE } from "../inputs";
import { createCommandOutput } from "../../output";

const DURATION_RE = /^(\d+)(s|m|h|d)$/;
const DURATION_UNITS_MS: Record<string, number> = {
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

// Verified against agent-intent-frontend's argocd/{stg,prd}/values.yaml BFF_BASE_URL (2026-09-22),
// same host/path the reference agent-intent.mjs CLI defaults to.
const DEFAULT_BFF_BASE_URLS = {
  staging: "https://global.api.stg.ledger-test.com/agent-intent",
  production: "https://global.api.prd.ledger.com/agent-intent",
} as const;

/** Parses `--expires-in` (e.g. 45s, 30m, 2h, 1d) into milliseconds. */
function parseDurationMs(value: string): number {
  const match = DURATION_RE.exec(value);
  if (!match) {
    throw new Error(`--expires-in "${value}" is invalid; use e.g. 45s, 30m, 2h, or 1d.`);
  }
  return Number(match[1]) * DURATION_UNITS_MS[match[2]];
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
      z
        .string()
        .min(1)
        .max(280)
        .default("Remote agent that proposes intents for review."),
      { description: "Agent description shown to the human reviewer, 1-280 characters." },
    ),
    source: option(z.enum(SUPPORTED_AGENT_SOURCES).default("openclaw"), {
      description: "Declared agent source.",
    }),
    "app-url": option(z.string().url(), {
      description: "Agent Intent frontend origin used for the enrollment handoff.",
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
    "keycloak-url": option(z.string().url().optional(), {
      description: "Override the Keycloak base URL (advanced/testing).",
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
            `or run \`wallet-cli agent-intent show ${flags.profile}\`.`,
        );
      }
      if (hasAgentIntentSecretKey(flags.profile)) {
        throw new Error(
          `A keychain entry for profile "${flags.profile}" already exists but is not recorded in the ` +
            "session. Remove it manually (or choose a different --profile id) before re-enrolling.",
        );
      }

      const bffBaseUrl = flags["bff-url"] ?? DEFAULT_BFF_BASE_URLS[flags.environment];

      const identity = createSoftwareAgentIdentity();
      const request = createAgentEnrollmentRequest(identity, {
        name: flags.name,
        description: flags.description,
        source: flags.source,
        expiresAt: new Date(Date.now() + expiresInMs).toISOString(),
      });

      await saveAgentIntentSecretKey(flags.profile, identity.exportSecretKey());
      session.addAgentIntentProfile({
        profileId: flags.profile,
        displayName: flags.name,
        description: flags.description,
        source: flags.source,
        environment: flags.environment,
        bffBaseUrl,
        ...(flags["keycloak-url"] ? { keycloakBaseUrl: flags["keycloak-url"] } : {}),
        publicKey: identity.publicKey,
        createdAt: new Date().toISOString(),
      });
      session.write();

      out.agentIntentEnroll({
        profileId: flags.profile,
        enrollmentUrl: createAgentEnrollmentUrl(flags["app-url"], request),
        fingerprint: formatAgentPublicKeyFingerprint(identity.publicKey),
      });
    });
  },
});
