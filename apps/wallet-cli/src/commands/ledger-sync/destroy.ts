import { defineCommand } from "@bunli/core";
import type { MemberCredentials } from "@ledgerhq/ledger-key-ring-protocol/types";
import {
  Session,
  sameTrustchainMeta,
  trustchainFromMeta,
  withSessionLock,
  type TrustchainMeta,
} from "../../session/session-store";
import {
  loadLedgerSyncMemberCredentials,
  deleteLedgerSyncMemberCredentials,
  hasLedgerSyncMemberCredentials,
  LedgerSyncCorruptKeychainError,
} from "../../ledger-sync/keychain";
import { createLkrpSdk } from "../../key-ring/lkrp-sdk";
import { LEDGER_SYNC_APPLICATION_ID, type LedgerSyncEnvironment } from "../../key-ring/constants";
import { outputOption, resolveOutputFormat, confirmTyped } from "../inputs";
import { createCommandOutput, type CommandOutput, type DestroyResult } from "../../output";

type RemoteOutcome = Omit<DestroyResult, "localWiped">;

const NO_REMOTE: RemoteOutcome = { remoteSucceeded: false, trustchainDestroyed: false };

// Stray keychain key with no session metadata (e.g. after `session reset` on a corrupt file): no
// remote to authenticate against, so local-wipe only — mirrors ring destroy's recovery path.
async function destroyStrayCredential(out: CommandOutput): Promise<void> {
  if (!hasLedgerSyncMemberCredentials()) {
    throw new Error("Nothing to destroy — Ledger Sync is not enrolled.");
  }
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
    return wipeLocal(fresh);
  });
  out.ledgerSyncDestroy({ ...NO_REMOTE, localWiped });
}

// A structurally corrupt keychain entry can't authenticate the remote teardown either way — treat
// it as "no credentials" (local wipe only) rather than throwing. Throwing would be a catch-22: the
// error's own message tells the user to run `ledger-sync destroy`, which would hit it again.
function loadUsableCredentials(): MemberCredentials | null {
  try {
    return loadLedgerSyncMemberCredentials();
  } catch (e) {
    if (!(e instanceof LedgerSyncCorruptKeychainError)) throw e;
    return null;
  }
}

async function tearDownRemote(
  out: CommandOutput,
  trustchainMeta: TrustchainMeta,
  memberCredentials: MemberCredentials,
  environment: LedgerSyncEnvironment,
): Promise<RemoteOutcome> {
  // Re-verify right before the remote side effect: the confirmation prompt can wait arbitrarily
  // long, and a concurrent re-enroll could reuse this rootId for a new stream.
  if (!sameTrustchainMeta((await Session.read()).ledgerSyncTrustchain, trustchainMeta)) {
    throw new Error(
      "Ledger Sync changed locally while this destroy was waiting for confirmation — nothing " +
        "was changed. Re-run `wallet-cli ledger-sync destroy` if you still want to tear down " +
        "the current one.",
    );
  }
  const sdk = createLkrpSdk({ applicationId: LEDGER_SYNC_APPLICATION_ID, environment });
  const destroySpin = out.spin("Deactivating Ledger Sync…");
  try {
    // destroyApplication closes only this application's stream (or destroys the whole trustchain
    // only when it was the last open application) — never wipes `ring`.
    const { trustchainDestroyed } = await sdk.destroyApplication(
      trustchainFromMeta(trustchainMeta),
      memberCredentials,
    );
    destroySpin?.stop();
    return { remoteSucceeded: true, trustchainDestroyed };
  } catch (e) {
    if ((e as { name?: string })?.name === "TrustchainEjected") {
      destroySpin?.stop();
      return { remoteSucceeded: true, trustchainDestroyed: false, memberEjected: true };
    }
    destroySpin?.error("Remote teardown failed");
    throw new Error(
      "Remote teardown failed (network/backend). No local changes made — retry when " +
        "connectivity is restored.",
      { cause: e },
    );
  }
}

/** What the remote teardown needs, or why it can't run (then only the local state is wiped). */
function remoteTarget(
  memberCredentials: MemberCredentials | null,
  environment: LedgerSyncEnvironment | undefined,
):
  | { memberCredentials: MemberCredentials; environment: LedgerSyncEnvironment }
  | { reason: string } {
  if (!memberCredentials) {
    return { reason: "No Ledger Sync credentials in keychain — continuing with local wipe." };
  }
  if (!environment) {
    return {
      reason:
        "The session doesn't record a valid Ledger Sync environment, so the right backend is " +
        "unknown — continuing with local wipe. Remove this machine from Ledger Sync in Ledger Live.",
    };
  }
  return { memberCredentials, environment };
}

// Clear the session pointer only once the key is actually gone; if its removal failed, keep the
// metadata so the user can re-run destroy (a stale pointer is harmless by comparison).
function wipeLocal(session: Session): boolean {
  const wiped = deleteLedgerSyncMemberCredentials();
  if (wiped) {
    session.wipeLedgerSync();
    session.write();
  }
  return wiped;
}

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
        await destroyStrayCredential(out);
        return;
      }
      if (!(await confirmTyped("destroy"))) {
        out.ledgerSyncDestroyCancelled();
        return;
      }

      const target = remoteTarget(loadUsableCredentials(), session.ledgerSyncEnvironment);
      let remote = NO_REMOTE;
      if ("reason" in target) {
        out.spin(target.reason)?.error(target.reason);
      } else {
        remote = await tearDownRemote(
          out,
          trustchainMeta,
          target.memberCredentials,
          target.environment,
        );
      }

      const localWiped = await withSessionLock(async () => {
        const fresh = await Session.read();
        // The remote teardown above took a network round-trip; if the local pointer changed in
        // that window it no longer describes what was just torn down, so leave it alone.
        if (
          fresh.ledgerSyncTrustchain &&
          !sameTrustchainMeta(fresh.ledgerSyncTrustchain, trustchainMeta)
        ) {
          throw new Error(
            "Ledger Sync changed locally (re-enrolled or rotated) while this destroy was running. " +
              "The remote teardown above completed, but the local state was left untouched since " +
              "it no longer matches what this destroy started with.",
          );
        }
        return wipeLocal(fresh);
      });
      out.ledgerSyncDestroy({ ...remote, localWiped });
    });
  },
});
