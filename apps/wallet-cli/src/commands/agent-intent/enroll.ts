import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import {
  createAgentEnrollmentChannelHost,
  createAgentEnrollmentRequest,
  createAgentEnrollmentUrl,
  createSoftwareAgentIdentity,
  formatAgentPublicKeyFingerprint,
  SUPPORTED_AGENT_SOURCES,
  AGENT_ENROLLMENT_CHANNEL_VERSION,
  AGENT_INTENT_FRONTEND_URLS,
  AGENT_KEYCLOAK_ENVIRONMENTS,
  type AgentEnrollmentChannelCompletion,
  type AgentEnrollmentChannelHost,
  type AgentEnrollmentChannelRequest,
  type AgentEnrollmentCompletionV2,
} from "@ledgerhq/agent-intent-sdk";
import { Session, AGENT_INTENT_ENVIRONMENTS, withSessionLock } from "../../session/session-store";
import {
  hasAgentIntentSecretKey,
  saveAgentIntentSecretKey,
  deleteAgentIntentSecretKey,
} from "../../key-ring/agent-intent-keychain";
import { AGENT_INTENT_TRUSTCHAIN_URLS } from "../../key-ring/constants";
import { authenticateEnrollmentCompletion } from "../../agent-intent/completion-auth";
import { outputOption, resolveOutputFormat } from "../inputs";
import {
  PROFILE_ID_RE,
  PROFILE_ID_MESSAGE,
  hasUrlCredentials,
} from "../../agent-intent/profile-format";
import { createCommandOutput } from "../../output";

function assertHttpUrl(value: string, flagName: string): void {
  if (!/^https?:$/.test(new URL(value).protocol)) {
    throw new Error(`--${flagName} must be an http(s) URL.`);
  }
}

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
  if (session.invalidAgentIntentProfileIds.includes(profileId)) {
    throw new Error(
      `session.yaml has an invalid Agent Intent record for profile "${profileId}". Fix or remove ` +
        "it in session.yaml (or choose a different --profile id) before re-enrolling.",
    );
  }
  if (hasAgentIntentSecretKey(profileId)) {
    throw new Error(
      `A keychain entry for profile "${profileId}" already exists but is not recorded in the ` +
        "session. Remove it manually (or choose a different --profile id) before re-enrolling.",
    );
  }
}

// Verified against agent-intent-frontend's argocd/{stg,prd}/values.yaml BFF_BASE_URL (2026-09-22).
// The SDK has no default of its own for bffBaseUrl, so this stays local.
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

function assertServiceUrl(value: string, flagName: string): void {
  assertHttpUrl(value, flagName);
  assertNoUrlCredentials(value, flagName);
}

/** Waits for the relayed completion; SIGINT/SIGTERM close the relay socket and abort the wait. */
function waitForRelayCompletion<Request extends AgentEnrollmentChannelRequest>(
  host: AgentEnrollmentChannelHost,
  input: {
    request: Request;
    authenticate: (completion: AgentEnrollmentChannelCompletion<Request>) => Promise<void>;
    persist: (completion: AgentEnrollmentChannelCompletion<Request>) => Promise<void>;
  },
): Promise<AgentEnrollmentChannelCompletion<Request>> {
  let rejectInterrupted!: (reason: Error) => void;
  const interrupted = new Promise<never>((_, reject) => {
    rejectInterrupted = reject;
  });
  const onSignal = () => {
    host.close();
    rejectInterrupted(new Error("Enrollment interrupted."));
  };
  process.once("SIGINT", onSignal);
  process.once("SIGTERM", onSignal);
  const completion = new Promise<AgentEnrollmentChannelCompletion<Request>>(resolve =>
    resolve(host.waitForCompletion(input)),
  );
  return Promise.race([completion, interrupted]).finally(() => {
    process.off("SIGINT", onSignal);
    process.off("SIGTERM", onSignal);
  });
}

export default defineCommand({
  name: "enroll",
  description:
    "Create an Agent Intent profile, print its signed enrollment URL, and wait for the approval to " +
    "be relayed back (no device required).",
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
    environment: option(z.enum(AGENT_INTENT_ENVIRONMENTS).default("production"), {
      description: "Agent Intent environment.",
    }),
    "bff-url": option(z.string().url().optional(), {
      description: "Agent Intent BFF base URL (default: the environment's own BFF).",
    }),
    "keycloak-url": option(z.string().url().optional(), {
      description:
        "Keycloak base URL used to prove App-18 membership (default: the environment's).",
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

      const { environment, profile: profileId } = flags;
      const bffBaseUrl = flags["bff-url"] ?? DEFAULT_BFF_BASE_URLS[environment];
      const appUrl = flags["app-url"] ?? AGENT_INTENT_FRONTEND_URLS[environment];
      const keycloakBaseUrl = flags["keycloak-url"];
      assertServiceUrl(appUrl, "app-url");
      assertServiceUrl(bffBaseUrl, "bff-url");
      if (keycloakBaseUrl !== undefined) assertServiceUrl(keycloakBaseUrl, "keycloak-url");
      const enrollmentExpiresAt = new Date(Date.now() + expiresInMs).toISOString();

      // Fast, unlocked precheck: fail on an obvious typo/duplicate before spending a keypair
      // generation + signature on it. Not a substitute for the recheck below — a concurrent enroll
      // of the same profile can still pass this one.
      assertProfileAvailable(await Session.read(), profileId);

      const identity = createSoftwareAgentIdentity();
      // Relay timers default to 15 min; stretch them so only the signed expiry bounds the wait.
      const host = createAgentEnrollmentChannelHost({
        environment,
        relayBaseUrl: AGENT_INTENT_TRUSTCHAIN_URLS[environment],
        timeouts: { candidateTimeoutMs: expiresInMs, completionTimeoutMs: expiresInMs },
      });
      try {
        const request = createAgentEnrollmentRequest(identity, {
          name: flags.name,
          description: flags.description,
          source: flags.source,
          expiresAt: enrollmentExpiresAt,
          channel: host.binding,
        });
        if (request.version !== AGENT_ENROLLMENT_CHANNEL_VERSION) {
          throw new Error("Agent Intent SDK did not build a relay-bound enrollment request.");
        }
        // Built before anything is persisted, so a failure here leaves no profile or keychain entry.
        const enrollmentUrl = createAgentEnrollmentUrl(appUrl, request);

        // Shared with every other command that mutates session.yaml — see withSessionLock's doc.
        await withSessionLock(async () => {
          const session = await Session.read();
          assertProfileAvailable(session, profileId);

          try {
            await saveAgentIntentSecretKey(profileId, identity.exportSecretKey());
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
              profileId,
              displayName: flags.name,
              description: flags.description,
              source: flags.source,
              environment,
              bffBaseUrl,
              ...(keycloakBaseUrl === undefined ? {} : { keycloakBaseUrl }),
              publicKey: identity.publicKey,
              enrollmentExpiresAt,
              createdAt: new Date().toISOString(),
            });
            session.write();
          } catch (e) {
            // Undo the keychain write so a retry doesn't hit "keychain entry exists but isn't
            // recorded in the session". If the rollback itself fails, say so, so the user knows to
            // remove the entry by hand instead of retrying forever.
            const rolledBack = deleteAgentIntentSecretKey(profileId);
            if (!rolledBack) {
              throw new Error(
                `${e instanceof Error ? e.message : String(e)} Additionally, the keychain rollback ` +
                  `for profile "${profileId}" failed — remove that entry manually before retrying, ` +
                  `or re-enrolling will refuse it as an orphaned duplicate.`,
                { cause: e },
              );
            }
            throw e;
          }
        });

        out.agentIntentEnrollmentPending({
          profileId,
          enrollmentUrl,
          fingerprint: formatAgentPublicKeyFingerprint(identity.publicKey),
          expiresAt: enrollmentExpiresAt,
        });

        let persisted: AgentEnrollmentCompletionV2 | undefined;
        const persist = (completion: AgentEnrollmentCompletionV2) =>
          withSessionLock(async () => {
            const session = await Session.read();
            const profile = session.getAgentIntentProfile(profileId);
            if (!profile || profile.trustchainId || profile.publicKey !== identity.publicKey) {
              throw new Error(
                `Agent Intent profile "${profileId}" was removed or changed while waiting for ` +
                  "approval; refusing to record the completion.",
              );
            }
            const {
              mode,
              environment: accessEnvironment,
              trustchainId,
              applicationPath,
            } = completion.accountAccess;
            session.updateAgentIntentProfile(profileId, {
              trustchainId: completion.trustchainId,
              accountAccess: {
                mode,
                environment: accessEnvironment,
                trustchainId,
                applicationPath,
              },
            });
            session.write();
            persisted = completion;
          });

        let completion: AgentEnrollmentCompletionV2;
        try {
          completion = await waitForRelayCompletion(host, {
            request,
            authenticate: candidate =>
              authenticateEnrollmentCompletion({
                completion: candidate,
                identity,
                environment,
                ...(keycloakBaseUrl === undefined
                  ? {}
                  : {
                      keycloak: {
                        ...AGENT_KEYCLOAK_ENVIRONMENTS[environment],
                        baseUrl: keycloakBaseUrl,
                      },
                    }),
              }),
            persist,
          });
        } catch (e) {
          if (!persisted) {
            throw new Error(
              `Enrollment did not complete (${e instanceof Error ? e.message : String(e)}). ` +
                `Profile "${profileId}" stays pending and cannot be resumed — start a fresh ` +
                "enrollment with a new --profile id.",
              { cause: e },
            );
          }
          // Saved and verified locally; only the acknowledgement back to the frontend failed.
          completion = persisted;
        }

        out.agentIntentEnrolled({
          profileId,
          trustchainId: completion.trustchainId,
          accountAccessEnvironment: completion.accountAccess.environment,
        });
      } finally {
        host.close();
      }
    });
  },
});
