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
import {
  Session,
  AGENT_INTENT_ENVIRONMENTS,
  withSessionLock,
  type AgentIntentKeyStore,
} from "../../session/session-store";
import {
  hasAgentIntentSecretKey,
  saveAgentIntentSecretKey,
  deleteAgentIntentSecretKey,
} from "../../key-ring/agent-intent-keychain";
import {
  agentIntentKeyFilePath,
  hasAgentIntentKeyFile,
  saveAgentIntentKeyFile,
  deleteAgentIntentKeyFile,
} from "../../key-ring/agent-intent-key-file";
import { assertOsKeychainAvailable } from "../../key-ring/keychain-entry";
import { KeychainUnavailableError } from "../../key-ring/keychain-unavailable-error";
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
import { errMessage } from "../../shared/error-message";
import { walletCliDebug } from "../../shared/log";
import { writeStderr } from "../../shared/ui";

const NO_KEYCHAIN_HINT =
  "Agent Intent stores the agent key in the OS keychain, so nothing was saved. Re-run with " +
  "--allow-plaintext-key only after the human explicitly agrees to store the agent key " +
  "unencrypted on this machine.";
const REFUSED_WRITE_HINT =
  "Unlock the keychain collection and re-run, or re-run with --allow-plaintext-key only after " +
  "the human explicitly agrees to store the agent key unencrypted on this machine.";

/** Checked once (fast) before generating an identity, and again (authoritative) inside the lock
 * right before writing — a concurrent enroll of the same profile id could pass the first check and
 * still lose the race to the second. Also returns where the agent key will be stored: the second
 * check reuses the first one's keychain probe (`prechecked`) and only re-reads the entry. */
function checkProfileAndChooseKeyStore(
  session: Session,
  profileId: string,
  allowPlaintextKey: boolean,
  prechecked?: AgentIntentKeyStore,
): AgentIntentKeyStore {
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
  if (hasAgentIntentKeyFile(profileId)) {
    throw new Error(
      `An agent key file for profile "${profileId}" already exists ` +
        `(${agentIntentKeyFilePath(profileId)}) but is not recorded in the session. Remove it ` +
        "manually (or choose a different --profile id) before re-enrolling.",
    );
  }
  const keyStore = prechecked ?? chooseKeyStore(profileId, allowPlaintextKey);
  return keyStore === "os-keychain" ? checkNoKeychainEntry(profileId, allowPlaintextKey) : keyStore;
}

// An entry that can't be read, e.g. one in a locked collection, may be the only copy of an older
// key. It is never written over: it counts as a keychain that refuses the write.
function checkNoKeychainEntry(profileId: string, allowPlaintextKey: boolean): AgentIntentKeyStore {
  let exists: boolean;
  try {
    exists = hasAgentIntentSecretKey(profileId);
  } catch (e) {
    const failure = {
      linux: `The OS keychain can't read the entry of profile "${profileId}"`,
      elsewhere: `Could not read the OS keychain entry of profile "${profileId}"`,
    };
    assertPlaintextFallbackAllowed(e, failure, allowPlaintextKey);
    writeStderr(
      `⚠ ${failure.linux} (${errMessage(e)}); the agent key goes to the plaintext file ` +
        `${agentIntentKeyFilePath(profileId)} because --allow-plaintext-key was passed.\n`,
    );
    return "plaintext-file";
  }
  if (exists) {
    throw new Error(
      `A keychain entry for profile "${profileId}" already exists but is not recorded in the ` +
        "session. Remove it manually (or choose a different --profile id) before re-enrolling.",
    );
  }
  return "os-keychain";
}

// The OS keychain always wins; the plaintext file is only a consented fallback. Runs before
// anything is generated or printed, so the human never approves a link that can't be saved.
function chooseKeyStore(profileId: string, allowPlaintextKey: boolean): AgentIntentKeyStore {
  try {
    assertOsKeychainAvailable(NO_KEYCHAIN_HINT);
    return "os-keychain";
  } catch (e) {
    if (!allowPlaintextKey || !(e instanceof KeychainUnavailableError)) throw e;
    writeStderr(
      `⚠ No OS keychain is available (${errMessage(e.cause)}); the agent key goes to the ` +
        `plaintext file ${agentIntentKeyFilePath(profileId)} because --allow-plaintext-key was ` +
        "passed.\n",
    );
    return "plaintext-file";
  }
}

// A reachable keychain that can't take the key (a refused write, an unreadable entry) gives way to
// the key file only on Linux and only with --allow-plaintext-key. `failure` names what went wrong,
// in the Linux wording or in the generic error used elsewhere.
function assertPlaintextFallbackAllowed(
  e: unknown,
  failure: { linux: string; elsewhere: string },
  allowPlaintextKey: boolean,
): void {
  if (process.platform !== "linux") {
    throw new Error(
      `${failure.elsewhere} (${errMessage(e)}). Agent Intent needs a working OS keychain: macOS ` +
        "Keychain, Windows Credential Manager, or on Linux a running Secret Service provider " +
        "(e.g. gnome-keyring or KeePassXC) with an unlocked collection. Nothing was saved.",
      { cause: e },
    );
  }
  if (!allowPlaintextKey) {
    throw new KeychainUnavailableError(
      `${failure.linux} (${errMessage(e)}), so nothing was saved. ${REFUSED_WRITE_HINT}`,
      { cause: e },
    );
  }
}

function saveKeyFile(profileId: string, secretKey: string): void {
  try {
    saveAgentIntentKeyFile(profileId, secretKey);
  } catch (e) {
    throw new Error(
      `Could not write the agent key file ${agentIntentKeyFilePath(profileId)} ` +
        `(${errMessage(e)}). Nothing was saved.`,
      { cause: e },
    );
  }
}

// Returns the store the key actually went to: a keychain that refuses the write falls back to the
// key file only on Linux and only with --allow-plaintext-key.
async function saveSecretKey(
  keyStore: AgentIntentKeyStore,
  profileId: string,
  secretKey: string,
  allowPlaintextKey: boolean,
): Promise<AgentIntentKeyStore> {
  if (keyStore === "plaintext-file") {
    saveKeyFile(profileId, secretKey);
    return keyStore;
  }
  try {
    await saveAgentIntentSecretKey(profileId, secretKey);
    return keyStore;
  } catch (e) {
    walletCliDebug("agent-intent: keychain write failed", e);
    // Secret Service gone since the probe is the same condition the probe reports.
    try {
      assertOsKeychainAvailable(NO_KEYCHAIN_HINT);
    } catch (probeError) {
      if (!allowPlaintextKey || !(probeError instanceof KeychainUnavailableError)) throw probeError;
      saveKeyFile(profileId, secretKey);
      writeStderr(
        `⚠ No OS keychain is reachable anymore (${errMessage(e)}); the agent key went to the ` +
          `plaintext file ${agentIntentKeyFilePath(profileId)} because --allow-plaintext-key was ` +
          "passed.\n",
      );
      return "plaintext-file";
    }
    // Reachable but refusing the write, e.g. a locked collection with no one to unlock it.
    const failure = {
      linux: "The OS keychain refused to store the agent key",
      elsewhere: "Could not store the agent's secret key in the OS keychain",
    };
    assertPlaintextFallbackAllowed(e, failure, allowPlaintextKey);
    saveKeyFile(profileId, secretKey);
    writeStderr(
      `⚠ The OS keychain refused the write (${errMessage(e)}); the agent key went to the ` +
        `plaintext file ${agentIntentKeyFilePath(profileId)} because --allow-plaintext-key was ` +
        "passed.\n",
    );
    return "plaintext-file";
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
    "allow-plaintext-key": option(z.boolean().default(false), {
      description:
        "Linux only: store the agent key unencrypted in a 0600 file when no Secret Service is " +
        "reachable or it can't take the key (e.g. a locked collection). Use only after the human " +
        "explicitly agrees.",
      argumentKind: "flag",
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
        const precheckedKeyStore = checkProfileAndChooseKeyStore(
          await Session.read(),
          profileId,
          flags["allow-plaintext-key"],
        );

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
          const keyStore = await withSessionLock(async () => {
            const session = await Session.read();
            const chosenKeyStore = checkProfileAndChooseKeyStore(
              session,
              profileId,
              flags["allow-plaintext-key"],
              precheckedKeyStore,
            );

            const keyStore = await saveSecretKey(
              chosenKeyStore,
              profileId,
              identity.exportSecretKey(),
              flags["allow-plaintext-key"],
            );
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
                keyStore,
                enrollmentExpiresAt,
                createdAt: new Date().toISOString(),
              });
              session.write();
            } catch (e) {
              // Undo the key write so a retry doesn't hit "keychain entry (or key file) exists but
              // isn't recorded in the session". If the rollback itself fails, say so, so the user
              // knows to remove the keychain entry or key file by hand instead of retrying forever.
              const rolledBack =
                keyStore === "plaintext-file"
                  ? deleteAgentIntentKeyFile(profileId)
                  : deleteAgentIntentSecretKey(profileId);
              if (!rolledBack) {
                const [store, item] =
                  keyStore === "plaintext-file" ? ["key file", "file"] : ["keychain", "entry"];
                throw new Error(
                  `${errMessage(e)} Additionally, the ${store} rollback for profile ` +
                    `"${profileId}" failed — remove that ${item} manually before retrying, ` +
                    `or re-enrolling will refuse it as an orphaned duplicate.`,
                  { cause: e },
                );
              }
              throw e;
            }
            return keyStore;
          });
          if (flags["allow-plaintext-key"] && keyStore === "os-keychain") {
            writeStderr(
              "OS keychain is available: the agent key is stored in the OS keychain and " +
                "--allow-plaintext-key was ignored.\n",
            );
          }

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
            keyStore,
          });
        } finally {
          host.close();
        }
      });
    });
  },
});
