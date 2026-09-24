import { defineCommand } from "@bunli/core";
import type { MemberCredentials, Trustchain } from "@ledgerhq/ledger-key-ring-protocol/types";
import {
  Session,
  sameTrustchainMeta,
  trustchainFromMeta,
  withSessionLock,
  type TrustchainMeta,
} from "../../session/session-store";
import { createLkrpSdk } from "../../key-ring/lkrp-sdk";
import { LEDGER_SYNC_APPLICATION_ID, type LedgerSyncEnvironment } from "../../key-ring/constants";
import {
  loadLedgerSyncMemberCredentials,
  LedgerSyncCorruptKeychainError,
} from "../../ledger-sync/keychain";
import {
  pullSyncedAccounts,
  mergeSyncedAccounts,
  type LedgerSyncImportReport,
  type PullResult,
} from "../../ledger-sync/cloud-sync-accounts";
import { outputOption, resolveOutputFormat } from "../inputs";
import { createCommandOutput, type CommandOutput } from "../../output";
import { writeStderr } from "../../shared/ui";

const EMPTY_REPORT: LedgerSyncImportReport = {
  imported: [],
  unchanged: [],
  skipped: [],
  invalid: [],
};

// Recorded once at `ledger-sync enroll` time — reused here rather than a per-call flag, so the LKRP
// backend and the Cloud Sync backend can never disagree. Never guessed: a missing or unreadable
// value could send a staging enrollment to production.
function requireEnvironment(session: Session): LedgerSyncEnvironment {
  const environment = session.ledgerSyncEnvironment;
  if (!environment) {
    throw new Error(
      "The session doesn't record a valid Ledger Sync environment for this enrollment. Run " +
        "`wallet-cli ledger-sync destroy` then `wallet-cli ledger-sync enroll --environment " +
        "<staging|production>` to reset.",
    );
  }
  return environment;
}

function requireCredentials(): MemberCredentials {
  let memberCredentials: MemberCredentials | null;
  try {
    memberCredentials = loadLedgerSyncMemberCredentials();
  } catch (e) {
    if (!(e instanceof LedgerSyncCorruptKeychainError)) throw e;
    memberCredentials = null;
  }
  if (!memberCredentials) {
    throw new Error(
      "Ledger Sync member credentials not found in the OS keychain. Run " +
        "`wallet-cli ledger-sync destroy` then `wallet-cli ledger-sync enroll` to reset.",
    );
  }
  return memberCredentials;
}

async function restoreKey(
  out: CommandOutput,
  sdk: ReturnType<typeof createLkrpSdk>,
  trustchainMeta: TrustchainMeta,
  memberCredentials: MemberCredentials,
): Promise<Trustchain> {
  const importSpin = out.spin("Restoring Ledger Sync encryption key…");
  try {
    const restored = await sdk.restoreTrustchain(
      trustchainFromMeta(trustchainMeta),
      memberCredentials,
    );
    importSpin?.success("Ledger Sync key ready");
    return restored;
  } catch (e) {
    importSpin?.error("Restore failed");
    if ((e as { name?: string })?.name === "TrustchainEjected") {
      throw new Error(
        "This machine is no longer a Ledger Sync member (removed elsewhere, or Ledger Sync was " +
          "deactivated). Run `wallet-cli ledger-sync destroy` then `wallet-cli ledger-sync enroll` " +
          "to re-enroll.",
        { cause: e },
      );
    }
    throw e;
  }
}

// Key rotation (e.g. a member was removed elsewhere): persist the new applicationPath so the next
// import re-derives the current key instead of retrying the stale one.
async function persistRotation(
  previous: TrustchainMeta,
  current: TrustchainMeta,
  environment: LedgerSyncEnvironment,
): Promise<void> {
  writeStderr("⚠ Ledger Sync key rotated since last use — re-importing with the current key.\n");
  await withSessionLock(async () => {
    const fresh = await Session.read();
    // Else something else already moved Ledger Sync (destroyed, rotated, re-enrolled) since this
    // command started — this rotation update is stale, so skip it rather than clobber it.
    if (sameTrustchainMeta(fresh.ledgerSyncTrustchain, previous)) {
      fresh.setLedgerSyncTrustchain(current, environment);
      fresh.write();
    }
  });
}

// Merge against a fresh read under the lock: the key restore and pull were network round-trips,
// and writing the session read at the start would clobber anything another command saved in the
// meantime (discovered accounts, Agent Intent profiles, ring state).
function mergeUnderLock(
  pulled: Extract<PullResult, { status: "new-data" } | { status: "deleted" }>,
  expected: TrustchainMeta,
): Promise<LedgerSyncImportReport> {
  return withSessionLock(async () => {
    const fresh = await Session.read();
    if (!sameTrustchainMeta(fresh.ledgerSyncTrustchain, expected)) {
      throw new Error(
        "Ledger Sync changed locally (destroyed, re-enrolled or rotated) while this import was " +
          "running — nothing was saved. Re-run `wallet-cli ledger-sync import`.",
      );
    }
    if (pulled.status === "deleted") {
      // Remote data was deleted: remote absence never deletes a local account (import is
      // additive-only) — just clear the version cache so a future push starts clean.
      fresh.clearLedgerSyncVersion();
      fresh.write();
      return EMPTY_REPORT;
    }
    const merged = mergeSyncedAccounts(fresh, pulled.accounts);
    // Only advance the cached version when nothing came back `invalid` — an invalid entry usually
    // means a real bug (or transient corruption) in the synced data, and bumping the version here
    // would make the next `import` see "up-to-date" and never hand back these raw accounts again.
    // `skipped` entries are a stable, intentional classification (an unsupported currency family)
    // and don't block it.
    if (merged.invalid.length === 0) {
      fresh.setLedgerSyncVersion(pulled.version);
    }
    fresh.write();
    return merged;
  });
}

export default defineCommand({
  name: "import",
  description:
    "Pull Ledger Sync's synchronized accounts and merge them into the local wallet-cli session " +
    "(additive, idempotent — never deletes an existing session entry). Does not run automatically; " +
    "call it explicitly whenever you want fresh data. Uses whichever environment `ledger-sync " +
    "enroll` recorded — there is no per-call override, so this can never drift from the LKRP " +
    "backend used to restore the encryption key.",
  options: {
    output: outputOption,
  },
  handler: async ({ flags }) => {
    const out = createCommandOutput(resolveOutputFormat(flags.output), {
      command: "ledger-sync import",
      network: "all",
    });
    await out.run(async () => {
      const session = await Session.read();
      const trustchainMeta = session.ledgerSyncTrustchain;
      if (!trustchainMeta) {
        throw new Error("Ledger Sync not enrolled. Run `wallet-cli ledger-sync enroll` first.");
      }
      const environment = requireEnvironment(session);
      const memberCredentials = requireCredentials();
      const sdk = createLkrpSdk({ applicationId: LEDGER_SYNC_APPLICATION_ID, environment });

      const restored = await restoreKey(out, sdk, trustchainMeta, memberCredentials);
      const expected = { rootId: trustchainMeta.rootId, applicationPath: restored.applicationPath };
      if (restored.applicationPath !== trustchainMeta.applicationPath) {
        await persistRotation(trustchainMeta, expected, environment);
      }

      const pullSpin = out.spin("Pulling synchronized accounts…");
      const pulled = await pullSyncedAccounts(
        restored,
        memberCredentials,
        sdk,
        environment,
        () => session.ledgerSyncVersion,
      );
      pullSpin?.stop();

      if (pulled.status === "up-to-date") {
        out.ledgerSyncImport(EMPTY_REPORT);
      } else if (pulled.status === "malformed") {
        // Nothing to merge, and the version stays uncached so the next import pulls it again.
        out.ledgerSyncImport({
          ...EMPTY_REPORT,
          invalid: [{ status: "invalid", id: "<account list>", reason: pulled.reason }],
        });
      } else {
        out.ledgerSyncImport(await mergeUnderLock(pulled, expected));
      }
    });
  },
});
