import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import type { MemberCredentials, Trustchain } from "@ledgerhq/ledger-key-ring-protocol/types";
import { Session, withSessionLock, type AgentIntentProfileMeta } from "../../session/session-store";
import { loadAgentIntentSecretKey } from "../../key-ring/agent-intent-keychain";
import { createAgentLedgerSyncSdk } from "../../key-ring/lkrp-sdk";
import { APP_16_PATH_RE } from "../../agent-intent/completion-auth";
import { PROFILE_ID_RE, PROFILE_ID_MESSAGE } from "../../agent-intent/profile-format";
import {
  pullSyncedAccounts,
  mergeSyncedAccounts,
  type LedgerSyncImportReport,
  type PullResult,
} from "../../ledger-sync/cloud-sync-accounts";
import { errMessage } from "../../shared/error-message";
import { outputOption, resolveOutputFormat } from "../inputs";
import { createCommandOutput, type CommandOutput } from "../../output";
import { writeStderr } from "../../shared/ui";

type AccountAccess = NonNullable<AgentIntentProfileMeta["accountAccess"]>;
type EnrolledProfile = AgentIntentProfileMeta & { accountAccess: AccountAccess };

const EMPTY_REPORT: LedgerSyncImportReport = {
  imported: [],
  unchanged: [],
  skipped: [],
  invalid: [],
};

function requireEnrolledProfile(session: Session, profileId: string): EnrolledProfile {
  const profile = session.getAgentIntentProfile(profileId);
  if (!profile) {
    throw new Error(`No Agent Intent profile named "${profileId}".`);
  }
  const { accountAccess } = profile;
  if (!accountAccess) {
    throw new Error(
      `Agent Intent profile "${profileId}" has no Ledger Sync access yet — complete its ` +
        "`agent-intent enroll` approval first.",
    );
  }
  return { ...profile, accountAccess };
}

async function requireAgentCredentials(profile: EnrolledProfile): Promise<MemberCredentials> {
  let secretKey: string | null;
  try {
    secretKey = await loadAgentIntentSecretKey(profile.profileId);
  } catch (e) {
    throw new Error(
      `Could not read the agent key of profile "${profile.profileId}" from the OS keychain ` +
        `(${errMessage(e)}).`,
      { cause: e },
    );
  }
  if (!secretKey) {
    throw new Error(
      `No agent key found in the OS keychain for profile "${profile.profileId}" — enroll a fresh ` +
        "profile.",
    );
  }
  return { pubkey: profile.publicKey, privatekey: secretKey };
}

async function restoreAgentTrustchain(
  out: CommandOutput,
  sdk: ReturnType<typeof createAgentLedgerSyncSdk>,
  profile: EnrolledProfile,
  credentials: MemberCredentials,
): Promise<Trustchain> {
  const { trustchainId, applicationPath } = profile.accountAccess;
  const spin = out.spin("Restoring Ledger Sync key…");
  let restored: Trustchain;
  try {
    restored = await sdk.restoreTrustchain(
      { rootId: trustchainId, applicationPath, walletSyncEncryptionKey: "" },
      credentials,
    );
  } catch (e) {
    spin?.error("Restore failed");
    if ((e as { name?: string })?.name === "TrustchainEjected") {
      throw new Error(
        `Agent "${profile.profileId}" no longer has Ledger Sync access (it was removed from the ` +
          "Ledger Sync group). Nothing was changed.",
        { cause: e },
      );
    }
    throw e;
  }
  if (restored.rootId !== trustchainId || !APP_16_PATH_RE.test(restored.applicationPath)) {
    spin?.error("Restore failed");
    throw new Error("Restored Ledger Sync trustchain does not match the profile's account access.");
  }
  spin?.success("Ledger Sync key ready");
  return restored;
}

function sameAccess(a: AccountAccess | undefined, b: AccountAccess): boolean {
  return (
    a?.environment === b.environment &&
    a.trustchainId === b.trustchainId &&
    a.applicationPath === b.applicationPath
  );
}

function isUnchanged(
  current: AgentIntentProfileMeta | undefined,
  profile: EnrolledProfile,
  expected: AccountAccess,
): boolean {
  return current?.publicKey === profile.publicKey && sameAccess(current.accountAccess, expected);
}

// The cached version belongs to the previous stream, so it is dropped along with it.
function persistRotation(profile: EnrolledProfile, rotated: AccountAccess): Promise<void> {
  writeStderr("⚠ Ledger Sync key rotated since enrollment — syncing with the current key.\n");
  return withSessionLock(async () => {
    const fresh = await Session.read();
    const current = fresh.getAgentIntentProfile(profile.profileId);
    if (!isUnchanged(current, profile, profile.accountAccess)) return;
    fresh.updateAgentIntentProfile(profile.profileId, {
      accountAccess: rotated,
      ledgerSyncVersion: undefined,
    });
    fresh.write();
  });
}

// Merged against a fresh read: the restore and pull were network round-trips, so writing the
// initial read would clobber whatever another command saved in the meantime.
function mergeUnderLock(
  pulled: Extract<PullResult, { status: "new-data" } | { status: "deleted" }>,
  profile: EnrolledProfile,
  expected: AccountAccess,
): Promise<LedgerSyncImportReport> {
  return withSessionLock(async () => {
    const fresh = await Session.read();
    if (!isUnchanged(fresh.getAgentIntentProfile(profile.profileId), profile, expected)) {
      throw new Error(
        `Agent Intent profile "${profile.profileId}" changed while this sync was running — ` +
          "nothing was saved. Re-run `wallet-cli agent-intent sync`.",
      );
    }
    if (pulled.status === "deleted") {
      fresh.updateAgentIntentProfile(profile.profileId, { ledgerSyncVersion: undefined });
      fresh.write();
      return EMPTY_REPORT;
    }
    const merged = mergeSyncedAccounts(fresh, pulled.accounts);
    // An invalid entry must come back on the next sync, so its version is not cached.
    if (merged.invalid.length === 0) {
      fresh.updateAgentIntentProfile(profile.profileId, { ledgerSyncVersion: pulled.version });
    }
    fresh.write();
    return merged;
  });
}

export default defineCommand({
  name: "sync",
  description:
    "Import the Ledger Sync accounts an enrolled agent was granted, using the agent's own key " +
    "(no device). Additive and idempotent — never deletes a session entry.",
  options: {
    profile: option(z.string().regex(PROFILE_ID_RE, PROFILE_ID_MESSAGE), {
      description: "Local profile id of an enrolled agent.",
    }),
    output: outputOption,
  },
  handler: async ({ flags }) => {
    const out = createCommandOutput(resolveOutputFormat(flags.output), {
      command: "agent-intent sync",
      network: "all",
      account: flags.profile,
    });
    await out.run(async () => {
      const profile = requireEnrolledProfile(await Session.read(), flags.profile);
      const credentials = await requireAgentCredentials(profile);
      const sdk = createAgentLedgerSyncSdk(profile.accountAccess.environment);

      const restored = await restoreAgentTrustchain(out, sdk, profile, credentials);
      const rotated = restored.applicationPath !== profile.accountAccess.applicationPath;
      const expected = { ...profile.accountAccess, applicationPath: restored.applicationPath };
      if (rotated) await persistRotation(profile, expected);

      const pullSpin = out.spin("Pulling synchronized accounts…");
      const pulled = await pullSyncedAccounts(
        restored,
        credentials,
        sdk,
        profile.accountAccess.environment,
        () => (rotated ? undefined : profile.ledgerSyncVersion),
      );
      pullSpin?.stop();

      if (pulled.status === "up-to-date") {
        out.agentIntentSync(EMPTY_REPORT);
      } else if (pulled.status === "malformed") {
        out.agentIntentSync({
          ...EMPTY_REPORT,
          invalid: [{ status: "invalid", id: "<account list>", reason: pulled.reason }],
        });
      } else {
        out.agentIntentSync(await mergeUnderLock(pulled, profile, expected));
      }
    });
  },
});
