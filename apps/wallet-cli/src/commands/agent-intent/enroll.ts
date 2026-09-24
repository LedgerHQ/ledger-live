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
import { Session, AGENT_INTENT_ENVIRONMENTS, withSessionLock } from "../../session/session-store";
import {
  hasAgentIntentSecretKey,
  saveAgentIntentSecretKey,
  deleteAgentIntentSecretKey,
} from "../../key-ring/agent-intent-keychain";
import { outputOption, resolveOutputFormat } from "../inputs";
import {
  PROFILE_ID_RE,
  PROFILE_ID_MESSAGE,
  hasUrlCredentials,
} from "../../agent-intent/profile-format";
import { createCommandOutput } from "../../output";

function assertNoUrlCredentials(value: string, flagName: string): void {
  if (hasUrlCredentials(value)) {
    throw new Error(
      `--${flagName} must not contain URL credentials (user:pass@) — they would be persisted or ` +
        "echoed back verbatim.",
    );
  }
}

/** Checked once (fast) before generating an identity, and again (authoritative) inside the lock
 * right before writing — a concurrent enroll of the same profile id could pass the first check and
 * still lose the race to the second. */
function assertProfileAvailable(session: Session, profileId: string): void {
  if (session.getAgentIntentProfile(profileId)) {
    throw new Error(
      `Agent Intent profile "${profileId}" already exists. Choose a different --profile id, or ` +
        `run \`wallet-cli agent-intent show --profile ${profileId}\`.`,
    );
  }
  if (hasAgentIntentSecretKey(profileId)) {
    throw new Error(
      `A keychain entry for profile "${profileId}" already exists but is not recorded in the ` +
        "session. Remove it manually (or choose a different --profile id) before re-enrolling.",
    );
  }
}

// Same values as agent-intent-frontend's per-environment BFF_BASE_URL. The SDK has no default for
// bffBaseUrl (unlike AGENT_INTENT_FRONTEND_URLS), so it is recorded on the profile at enroll time
// and reused by `agent-intent send`.
const DEFAULT_BFF_BASE_URLS = {
  staging: "https://global.api.stg.ledger-test.com/agent-intent",
  production: "https://global.api.prd.ledger.com/agent-intent",
} as const;

const DURATION_RE = /^([1-9]\d*)([smhd])$/;
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
    output: outputOption,
  },
  handler: async ({ flags }) => {
    const out = createCommandOutput(resolveOutputFormat(flags.output), {
      command: "agent-intent enroll",
      network: "all",
    });
    await out.run(async () => {
      const expiresInMs = parseDurationMs(flags["expires-in"]);

      const bffBaseUrl = DEFAULT_BFF_BASE_URLS[flags.environment];
      const appUrl = flags["app-url"] ?? AGENT_INTENT_FRONTEND_URLS[flags.environment];
      assertNoUrlCredentials(appUrl, "app-url");
      const enrollmentExpiresAt = new Date(Date.now() + expiresInMs).toISOString();

      // Fast, unlocked precheck: fail on an obvious typo/duplicate before spending a keypair
      // generation + signature on it. Not a substitute for the recheck below — a concurrent enroll
      // of the same profile can still pass this one.
      assertProfileAvailable(await Session.read(), flags.profile);

      const identity = createSoftwareAgentIdentity();
      const request = createAgentEnrollmentRequest(identity, {
        name: flags.name,
        description: flags.description,
        source: flags.source,
        expiresAt: enrollmentExpiresAt,
      });

      // Shared with every other command that mutates session.yaml (`complete`, `reset`, `account
      // discover`, `ring init`/`destroy`/`encrypt`/`decrypt`) — see withSessionLock's own doc.
      await withSessionLock(async () => {
        const session = await Session.read();
        assertProfileAvailable(session, flags.profile);

        try {
          await saveAgentIntentSecretKey(flags.profile, identity.exportSecretKey());
        } catch (e) {
          throw new Error(
            `Could not store the agent's secret key in the OS keychain (` +
              `${e instanceof Error ? e.message : String(e)}). Agent Intent needs a working OS ` +
              "keychain: macOS Keychain, Windows Credential Manager, or on Linux a running Secret " +
              "Service provider (e.g. gnome-keyring or KeePassXC) with an unlocked collection. " +
              "Nothing was saved.",
            { cause: e },
          );
        }
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
          // in the session" — this is the only place that failure can originate from. If the
          // rollback itself fails, that's exactly the state it would otherwise re-create silently:
          // say so, so the user knows to remove the entry by hand instead of retrying forever.
          const rolledBack = deleteAgentIntentSecretKey(flags.profile);
          if (!rolledBack) {
            throw new Error(
              `${e instanceof Error ? e.message : String(e)} Additionally, the keychain rollback ` +
                `for profile "${flags.profile}" failed — remove that entry manually before retrying, ` +
                `or re-enrolling will refuse it as an orphaned duplicate.`,
              { cause: e },
            );
          }
          throw e;
        }
      });

      out.agentIntentEnroll({
        profileId: flags.profile,
        enrollmentUrl: createAgentEnrollmentUrl(appUrl, request),
        fingerprint: formatAgentPublicKeyFingerprint(identity.publicKey),
      });
    });
  },
});
