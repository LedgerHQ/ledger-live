import { defineCommand } from "@bunli/core";
import { Session, trustchainFromMeta } from "../../session/session-store";
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
        const localWiped = deleteLedgerSyncMemberCredentials();
        if (localWiped) {
          session.wipeLedgerSync();
          session.write();
        }
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

      const localWiped = deleteLedgerSyncMemberCredentials();
      if (localWiped) {
        session.wipeLedgerSync();
        session.write();
      }
      out.ledgerSyncDestroy({ remoteSucceeded, trustchainDestroyed, localWiped, memberEjected });
    });
  },
});
