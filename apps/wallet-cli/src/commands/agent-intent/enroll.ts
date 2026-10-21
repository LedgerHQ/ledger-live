import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import {
  createAgentEnrollmentRequest,
  createAgentEnrollmentUrl,
  createSoftwareAgentIdentity,
  formatAgentPublicKeyFingerprint,
  SUPPORTED_AGENT_SOURCES,
  AGENT_ENROLLMENT_CHANNEL_VERSION,
  AGENT_INTENT_FRONTEND_URLS,
} from "@ledgerhq/agent-intent-sdk";
import { Session, AGENT_INTENT_ENVIRONMENTS, withSessionLock } from "../../session/session-store";
import {
  hasAgentIntentSecretKey,
  saveAgentIntentSecretKey,
  deleteAgentIntentSecretKey,
} from "../../key-ring/agent-intent-keychain";
import { authenticateEnrollmentCompletion } from "../../agent-intent/completion-auth";
import { outputOption, resolveOutputFormat } from "../inputs";
import { PROFILE_ID_RE, PROFILE_ID_MESSAGE } from "../../agent-intent/profile-format";
import {
  assertServiceUrl,
  createRelayHost,
  keycloakOverride,
  parseDurationMs,
  waitForRelayCompletion,
} from "../../agent-intent/relay";
import {
  enrollListenerPaths,
  readFirstLogJsonLine,
  selfCommand,
  spawnDetached,
  withEnrollListenerLock,
} from "../../agent-intent/detach";
import { readLiveLockHolderPid } from "../../shared/file-lock";
import { createCommandOutput, type CommandOutput } from "../../output";

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

const PendingLineSchema = z.object({
  type: z.literal("enrollment-pending"),
  profileId: z.string(),
  enrollmentUrl: z.string(),
  fingerprint: z.string(),
  expiresAt: z.string(),
});
const ErrorLineSchema = z.object({
  ok: z.literal(false),
  error: z.object({ message: z.string() }),
});

/** `--detach`: re-runs this enroll without `--detach` as a background listener, then reports the
 * listener's pending line and returns. The child's flags are rebuilt from the parsed ones (minus
 * `detach` and `output`), so flags added to `enroll` later carry over without argv parsing. */
async function startDetachedEnroll(
  flags: { profile: string; [flag: string]: unknown },
  out: CommandOutput,
): Promise<void> {
  if (process.platform === "win32") {
    throw new Error(
      "--detach is not supported on Windows. Run `wallet-cli agent-intent enroll` without " +
        "--detach, as a background job of your shell or agent host.",
    );
  }
  const profileId = flags.profile;
  const { logPath, lockPath } = enrollListenerPaths(profileId);
  // Checked before the spawn truncates the log a running listener still writes to.
  const runningPid = readLiveLockHolderPid(lockPath);
  if (runningPid !== undefined) {
    throw new Error(
      `An enrollment listener for profile "${profileId}" is already running (pid ${runningPid}). ` +
        `Run \`wallet-cli agent-intent wait --profile ${profileId}\` to check on it.`,
    );
  }

  const args = ["agent-intent", "enroll"];
  for (const [name, value] of Object.entries(flags)) {
    if (name === "detach" || name === "output" || value === undefined) continue;
    args.push(`--${name}=${String(value)}`);
  }
  args.push("--output=json");

  const child = spawnDetached(selfCommand(args), logPath);
  const first = await readFirstLogJsonLine(child, logPath);
  const pending = PendingLineSchema.safeParse(first);
  if (pending.success) {
    const { enrollmentUrl, fingerprint, expiresAt } = pending.data;
    out.agentIntentEnrollmentPending({
      profileId: pending.data.profileId,
      enrollmentUrl,
      fingerprint,
      expiresAt,
      listenerPid: child.pid,
      logPath,
    });
    return;
  }
  const failure = ErrorLineSchema.safeParse(first);
  if (failure.success) throw new Error(failure.data.error.message);
  child.kill();
  throw new Error(
    `The enrollment listener printed an unexpected first line and was stopped. See ${logPath}.`,
  );
}

// Verified against agent-intent-frontend's argocd/{stg,prd}/values.yaml BFF_BASE_URL (2026-09-22).
// The SDK has no default of its own for bffBaseUrl, so this stays local.
const DEFAULT_BFF_BASE_URLS = {
  staging: "https://global.api.stg.ledger-test.com/agent-intent",
  production: "https://global.api.prd.ledger.com/agent-intent",
} as const;

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
    source: option(z.enum(SUPPORTED_AGENT_SOURCES).default("other"), {
      description:
        `Runtime the agent runs in (not its model provider): ${SUPPORTED_AGENT_SOURCES.join(", ")}. ` +
        "Use other if none matches (default: other).",
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
    detach: option(z.boolean().default(false), {
      description:
        "Run the approval wait as a background listener: print the enrollment link and exit, then " +
        "check on it with `agent-intent wait` (Linux and macOS).",
      argumentKind: "flag",
    }),
    output: outputOption,
  },
  handler: async ({ flags }) => {
    const out = createCommandOutput(resolveOutputFormat(flags.output), {
      command: "agent-intent enroll",
      network: "all",
    });
    await out.run(async () => {
      if (flags.detach) {
        await startDetachedEnroll(flags, out);
        return;
      }
      // Held for the whole run, so `agent-intent wait` can tell a live listener from a dead one.
      await withEnrollListenerLock(flags.profile, async () => {
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
        const host = createRelayHost(environment, expiresInMs);
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

          const completion = await waitForRelayCompletion(
            host,
            {
              request,
              authenticate: candidate =>
                authenticateEnrollmentCompletion({
                  completion: candidate,
                  identity,
                  environment,
                  ...keycloakOverride(environment, keycloakBaseUrl),
                }),
              persist: relayed =>
                withSessionLock(async () => {
                  const session = await Session.read();
                  const profile = session.getAgentIntentProfile(profileId);
                  if (
                    !profile ||
                    profile.trustchainId ||
                    profile.publicKey !== identity.publicKey
                  ) {
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
                  } = relayed.accountAccess;
                  session.updateAgentIntentProfile(profileId, {
                    trustchainId: relayed.trustchainId,
                    accountAccess: {
                      mode,
                      environment: accessEnvironment,
                      trustchainId,
                      applicationPath,
                    },
                  });
                  session.write();
                }),
            },
            "Enrollment interrupted.",
          ).catch(e => {
            throw new Error(
              `Enrollment did not complete (${e instanceof Error ? e.message : String(e)}). ` +
                `Profile "${profileId}" stays pending and cannot be resumed — start a fresh ` +
                "enrollment with a new --profile id.",
              { cause: e },
            );
          });

          out.agentIntentEnrolled({
            profileId,
            trustchainId: completion.trustchainId,
            accountAccessEnvironment: completion.accountAccess.environment,
          });
        } finally {
          host.close();
        }
      });
    });
  },
});
