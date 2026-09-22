import { defineCommand } from "@bunli/core";
import { Session, trustchainFromMeta } from "../../session/session-store";
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
        restored = await sdk.restoreTrustchain(trustchainFromMeta(trustchainMeta), memberCredentials);
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
      if (restored.applicationPath !== trustchainMeta.applicationPath) {
        writeStderr(
          "⚠ Ledger Sync key rotated since last use — re-importing with the current key.\n",
        );
        session.setLedgerSyncTrustchain(
          {
            rootId: trustchainMeta.rootId,
            applicationPath: restored.applicationPath,
          },
          environment,
        );
        session.write();
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
      if (pulled.status === "deleted") {
        // Remote data was deleted: per NTTVS-728's additive-only rule, remote absence never deletes a
        // local account — just clear the version cache so a future push (out of this ticket's scope)
        // starts clean, and report nothing to merge.
        session.clearLedgerSyncVersion();
        session.write();
        out.ledgerSyncImport({ imported: [], unchanged: [], skipped: [], invalid: [] });
        return;
      }

      const report = mergeSyncedAccounts(session, pulled.accounts);
      session.setLedgerSyncVersion(pulled.version);
      session.write();
      out.ledgerSyncImport(report);
    });
  },
});
