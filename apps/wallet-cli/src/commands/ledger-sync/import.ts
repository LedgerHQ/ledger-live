import { defineCommand } from "@bunli/core";
import {
  Session,
  trustchainFromMeta,
  withSessionLock,
  type TrustchainMeta,
} from "../../session/session-store";
import { createLkrpSdk } from "../../key-ring/lkrp-sdk";
import { LEDGER_SYNC_APPLICATION_ID } from "../../key-ring/constants";
import {
  loadLedgerSyncMemberCredentials,
  LedgerSyncCorruptKeychainError,
} from "../../ledger-sync/keychain";
import { pullSyncedAccounts, mergeSyncedAccounts } from "../../ledger-sync/cloud-sync-accounts";
import { outputOption, resolveOutputFormat } from "../inputs";
import { createCommandOutput } from "../../output";
import { writeStderr } from "../../shared/ui";

function sameTrustchain(a: TrustchainMeta | undefined, b: TrustchainMeta): boolean {
  return a?.rootId === b.rootId && a.applicationPath === b.applicationPath;
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
      // Recorded once at `ledger-sync enroll` time — reused here rather than a per-call flag, so the
      // LKRP backend below and the Cloud Sync backend in pullSyncedAccounts() can never disagree.
      // Falls back to "production" only for a session enrolled before this field existed.
      const environment = session.ledgerSyncEnvironment ?? "production";

      let memberCredentials;
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

      const sdk = createLkrpSdk({ applicationId: LEDGER_SYNC_APPLICATION_ID, environment });

      const importSpin = out.spin("Restoring Ledger Sync encryption key…");
      let restored;
      try {
        restored = await sdk.restoreTrustchain(
          trustchainFromMeta(trustchainMeta),
          memberCredentials,
        );
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
      // Key rotation (e.g. a member was removed elsewhere): persist the new applicationPath so the
      // next import re-derives the current key instead of retrying the stale one.
      const expectedTrustchain = {
        rootId: trustchainMeta.rootId,
        applicationPath: restored.applicationPath,
      };
      if (restored.applicationPath !== trustchainMeta.applicationPath) {
        writeStderr(
          "⚠ Ledger Sync key rotated since last use — re-importing with the current key.\n",
        );
        await withSessionLock(async () => {
          const fresh = await Session.read();
          // Else something else already moved Ledger Sync (destroyed, rotated, re-enrolled) since this
          // command started — this rotation update is stale, so skip it rather than clobber it.
          if (sameTrustchain(fresh.ledgerSyncTrustchain, trustchainMeta)) {
            fresh.setLedgerSyncTrustchain(expectedTrustchain, environment);
            fresh.write();
          }
        });
      }
      importSpin?.success("Ledger Sync key ready");

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
        out.ledgerSyncImport({ imported: [], unchanged: [], skipped: [], invalid: [] });
        return;
      }
      // Merge against a fresh read under the lock: the key restore and pull above were network
      // round-trips, and writing the session read at the start would clobber anything another
      // command saved in the meantime (discovered accounts, Agent Intent profiles, ring state).
      const report = await withSessionLock(async () => {
        const fresh = await Session.read();
        if (!sameTrustchain(fresh.ledgerSyncTrustchain, expectedTrustchain)) {
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
          return { imported: [], unchanged: [], skipped: [], invalid: [] };
        }
        const merged = mergeSyncedAccounts(fresh, pulled.accounts);
        // Only advance the cached version when nothing came back `invalid` — an invalid entry
        // usually means a real bug (or transient corruption) in the synced data, and bumping the
        // version here would make the next `import` see "up-to-date" and never hand back these raw
        // accounts again, permanently losing the chance to recover once whatever caused it is fixed.
        // `skipped` entries are a stable, intentional classification (an unsupported currency
        // family) and don't block it.
        if (merged.invalid.length === 0) {
          fresh.setLedgerSyncVersion(pulled.version);
        }
        fresh.write();
        return merged;
      });
      out.ledgerSyncImport(report);
    });
  },
});
