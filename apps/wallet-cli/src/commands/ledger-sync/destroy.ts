import { defineCommand } from "@bunli/core";
import { Session, trustchainFromMeta, withSessionLock } from "../../session/session-store";
import {
  loadLedgerSyncMemberCredentials,
  deleteLedgerSyncMemberCredentials,
  hasLedgerSyncMemberCredentials,
  LedgerSyncCorruptKeychainError,
} from "../../ledger-sync/keychain";
import { createLkrpSdk } from "../../key-ring/lkrp-sdk";
import { LEDGER_SYNC_APPLICATION_ID } from "../../key-ring/constants";
import { outputOption, resolveOutputFormat, confirmTyped } from "../inputs";
import { createCommandOutput } from "../../output";

export default defineCommand({
  name: "destroy",
  description:
    "Deactivate Ledger Sync for this machine and wipe local member credentials. Uses " +
    "destroyApplication, which closes only Ledger Sync's own trustchain application — the `ring` " +
    "application (and its data) is never touched.",
  options: {
    output: outputOption,
  },
  handler: async ({ flags }) => {
    const out = createCommandOutput(resolveOutputFormat(flags.output), {
      command: "ledger-sync destroy",
      network: "all",
    });
    await out.run(async () => {
      const session = await Session.read();
      const trustchainMeta = session.ledgerSyncTrustchain;

      if (!trustchainMeta) {
        if (!hasLedgerSyncMemberCredentials()) {
          throw new Error("Nothing to destroy — Ledger Sync is not enrolled.");
        }
        // Stray keychain key with no session metadata (e.g. after `session reset` on a corrupt
        // file): no remote to authenticate against, so local-wipe only — mirrors ring destroy's
        // recovery path.
        if (!(await confirmTyped("destroy"))) {
          out.ledgerSyncDestroyCancelled();
          return;
        }
        const localWiped = await withSessionLock(async () => {
          const fresh = await Session.read();
          // The confirmation prompt waited on a human; another process could have run `ledger-sync
          // enroll` meanwhile, and wiping now would delete that fresh enrollment's only credential.
          if (fresh.ledgerSyncTrustchain) {
            throw new Error(
              "Ledger Sync was enrolled by another process while this destroy was waiting for " +
                "confirmation. Nothing was changed — re-run `wallet-cli ledger-sync destroy` if you " +
                "still want to tear it down.",
            );
          }
          const wiped = deleteLedgerSyncMemberCredentials();
          if (wiped) {
            fresh.wipeLedgerSync();
            fresh.write();
          }
          return wiped;
        });
        out.ledgerSyncDestroy({ remoteSucceeded: false, trustchainDestroyed: false, localWiped });
        return;
      }

      if (!(await confirmTyped("destroy"))) {
        out.ledgerSyncDestroyCancelled();
        return;
      }

      // Recorded once at `ledger-sync enroll` time; falls back to "production" only for a session
      // enrolled before this field existed.
      const environment = session.ledgerSyncEnvironment ?? "production";

      let memberCredentials;
      try {
        memberCredentials = loadLedgerSyncMemberCredentials();
      } catch (e) {
        // A structurally corrupt keychain entry can't authenticate the remote teardown either way —
        // treat it the same as "no credentials" (local wipe only) rather than throwing. Throwing here
        // would be a catch-22: this error's own message tells the user to run `ledger-sync destroy`,
        // which would hit the exact same throw again.
        if (!(e instanceof LedgerSyncCorruptKeychainError)) throw e;
        memberCredentials = null;
      }
      let remoteSucceeded = false;
      let trustchainDestroyed = false;
      let memberEjected = false;

      if (memberCredentials) {
        // Re-verify right before the remote side effect: the confirmation prompt can wait
        // arbitrarily long, and a concurrent re-enroll could reuse this rootId for a new stream.
        const preflight = await Session.read();
        if (
          preflight.ledgerSyncTrustchain?.rootId !== trustchainMeta.rootId ||
          preflight.ledgerSyncTrustchain.applicationPath !== trustchainMeta.applicationPath
        ) {
          throw new Error(
            "Ledger Sync changed locally while this destroy was waiting for confirmation — nothing " +
              "was changed. Re-run `wallet-cli ledger-sync destroy` if you still want to tear down " +
              "the current one.",
          );
        }
        const sdk = createLkrpSdk({ applicationId: LEDGER_SYNC_APPLICATION_ID, environment });
        const destroySpin = out.spin("Deactivating Ledger Sync…");
        try {
          // destroyApplication closes only this application's stream (or destroys the whole
          // trustchain only when it was the last open application) — never wipes `ring`.
          const result = await sdk.destroyApplication(
            trustchainFromMeta(trustchainMeta),
            memberCredentials,
          );
          trustchainDestroyed = result.trustchainDestroyed;
          remoteSucceeded = true;
          destroySpin?.stop();
        } catch (e) {
          if ((e as { name?: string })?.name === "TrustchainEjected") {
            remoteSucceeded = true;
            memberEjected = true;
            destroySpin?.stop();
          } else {
            destroySpin?.error("Remote teardown failed");
            throw new Error(
              "Remote teardown failed (network/backend). No local changes made — retry when " +
                "connectivity is restored.",
              { cause: e },
            );
          }
        }
      } else {
        const reason = "No Ledger Sync credentials in keychain — continuing with local wipe.";
        out.spin(reason)?.error(reason);
      }

      const localWiped = await withSessionLock(async () => {
        const fresh = await Session.read();
        // The remote teardown above took a network round-trip; if the local pointer changed in that
        // window it no longer describes what was just torn down, so leave it alone.
        if (
          fresh.ledgerSyncTrustchain &&
          (fresh.ledgerSyncTrustchain.rootId !== trustchainMeta.rootId ||
            fresh.ledgerSyncTrustchain.applicationPath !== trustchainMeta.applicationPath)
        ) {
          throw new Error(
            "Ledger Sync changed locally (re-enrolled or rotated) while this destroy was running. " +
              "The remote teardown above completed, but the local state was left untouched since it " +
              "no longer matches what this destroy started with.",
          );
        }
        const wiped = deleteLedgerSyncMemberCredentials();
        if (wiped) {
          fresh.wipeLedgerSync();
          fresh.write();
        }
        return wiped;
      });
      out.ledgerSyncDestroy({ remoteSucceeded, trustchainDestroyed, localWiped, memberEjected });
    });
  },
});
