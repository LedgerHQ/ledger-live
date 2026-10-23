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
import { assertOsKeychainAvailable, KeychainUnavailableError } from "../../key-ring/keychain-entry";
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
import { createCommandOutput } from "../../output";
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
  const keyStore = prechecked ?? chooseKeyStore(allowPlaintextKey);
  if (keyStore === "os-keychain" && hasAgentIntentSecretKey(profileId)) {
    throw new Error(
      `A keychain entry for profile "${profileId}" already exists but is not recorded in the ` +
        "session. Remove it manually (or choose a different --profile id) before re-enrolling.",
    );
  }
  return keyStore;
}

// The OS keychain always wins; the plaintext file is only a consented fallback. Runs before
// anything is generated or printed, so the human never approves a link that can't be saved.
function chooseKeyStore(allowPlaintextKey: boolean): AgentIntentKeyStore {
  try {
    assertOsKeychainAvailable(NO_KEYCHAIN_HINT);
    return "os-keychain";
  } catch (e) {
    if (allowPlaintextKey && e instanceof KeychainUnavailableError) return "plaintext-file";
    throw e;
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
    if (process.platform !== "linux") {
      throw new Error(
        `Could not store the agent's secret key in the OS keychain (${errMessage(e)}). Agent ` +
          "Intent needs a working OS keychain: macOS Keychain, Windows Credential Manager, or on " +
          "Linux a running Secret Service provider (e.g. gnome-keyring or KeePassXC) with an " +
          "unlocked collection. Nothing was saved.",
        { cause: e },
      );
    }
    // Reachable but refusing the write, e.g. a locked collection with no one to unlock it.
    if (!allowPlaintextKey) {
      throw new KeychainUnavailableError(
        `The OS keychain refused to store the agent key (${errMessage(e)}), so nothing was ` +
          `saved. ${REFUSED_WRITE_HINT}`,
        { cause: e },
      );
    }
    saveKeyFile(profileId, secretKey);
    writeStderr(
      `⚠ The OS keychain refused the write (${errMessage(e)}); the agent key went to the ` +
        `plaintext file ${agentIntentKeyFilePath(profileId)} because --allow-plaintext-key was ` +
        "passed.\n",
    );
    return "plaintext-file";
  }
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
        "Store the agent key unencrypted in a 0600 file when no OS keychain is available or (on " +
        "Linux) it refuses the write. Use only after the human explicitly agrees.",
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
  },
});
