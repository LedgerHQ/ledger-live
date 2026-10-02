import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import os from "node:os";
import type { MemberCredentials } from "@ledgerhq/ledger-key-ring-protocol/types";
import { Session, withSessionLock, type TrustchainMeta } from "../../session/session-store";
import { createLkrpSdk } from "../../key-ring/lkrp-sdk";
import {
  LEDGER_SYNC_APPLICATION_ID,
  LEDGER_SYNC_ENVIRONMENTS,
  MEMBER_NAME_MAX_LENGTH,
  type LedgerSyncEnvironment,
} from "../../key-ring/constants";
import {
  saveLedgerSyncMemberCredentials,
  deleteLedgerSyncMemberCredentials,
  ledgerSyncCredentialState,
} from "../../ledger-sync/keychain";
import { errMessage } from "../../shared/error-message";
import { WALLET_CLI_DMK_DEVICE_ID } from "../../device/register-dmk-transport";
import { withLkrpDeviceSession } from "../../session/bridge-device-session";
import { outputOption, resolveOutputFormat } from "../inputs";
import { createCommandOutput } from "../../output";

/**
 * Saves the enrollment locally. The device step has already registered this machine as a member
 * remotely, so a failure here can't be undone: roll back the keychain entry (a retry then starts
 * clean) and say which member was left on the remote side.
 */
function persistEnrollment(
  session: Session,
  memberCredentials: MemberCredentials,
  trustchainMeta: TrustchainMeta,
  environment: LedgerSyncEnvironment,
  memberName: string,
): void {
  try {
    saveLedgerSyncMemberCredentials(memberCredentials);
    session.setLedgerSyncTrustchain(trustchainMeta, environment);
    session.write();
  } catch (e) {
    const keychainCleared = deleteLedgerSyncMemberCredentials();
    throw new Error(
      `Ledger Sync registered "${memberName}" as a member, but saving the enrollment on this ` +
        `machine failed (${errMessage(e)}). ` +
        (keychainCleared
          ? ""
          : "Its keychain entry could not be removed either — run `wallet-cli ledger-sync " +
            "destroy` to clear it. ") +
        `Remove "${memberName}" from Ledger Sync in Ledger Live before re-running ` +
        "`wallet-cli ledger-sync enroll`, or it stays listed as a member.",
      { cause: e },
    );
  }
}

/** Mirrors ring/init.ts: refuse a stray keychain key with no session metadata (e.g. after a
 * `session reset` on a corrupt file) — overwriting it would orphan the previous remote member. An
 * entry that can't be read is treated the same way: it may be exactly such a key. */
function assertNoExistingCredential(): void {
  const state = ledgerSyncCredentialState();
  if (state === "present") {
    throw new Error(
      "A Ledger Sync member credential already exists in the OS keychain but this session has " +
        "no Ledger Sync metadata. Run `wallet-cli ledger-sync destroy` (or remove the keychain " +
        "entry) before re-enrolling.",
    );
  }
  if (state === "unreadable") {
    throw new Error(
      "Couldn't read the OS keychain to check for an existing Ledger Sync credential. Unlock or " +
        "fix the keychain and re-run — enrolling now could overwrite a credential that still " +
        "belongs to a Ledger Sync member.",
    );
  }
}

function defaultMemberName(): string {
  const raw = `${os.hostname()} (${os.platform()})`;
  return raw.slice(0, MEMBER_NAME_MAX_LENGTH);
}

export default defineCommand({
  name: "enroll",
  description:
    "Enroll or restore Ledger Sync on this machine (device required). Separate trust model from " +
    "`ring` and Agent Intent — grants no access to either.",
  options: {
    name: option(z.string().min(1).max(MEMBER_NAME_MAX_LENGTH).optional(), {
      description: `Member name (default: hostname + platform, max ${MEMBER_NAME_MAX_LENGTH} chars)`,
      short: "n",
    }),
    environment: option(z.enum(LEDGER_SYNC_ENVIRONMENTS).default("production"), {
      description:
        "Ledger Sync backend environment. Recorded on this profile and reused automatically by " +
        "every later `import`/`destroy` — not asked again.",
    }),
    output: outputOption,
  },
  handler: async ({ flags }) => {
    const out = createCommandOutput(resolveOutputFormat(flags.output), {
      command: "ledger-sync enroll",
      network: "all",
    });
    await out.run(async () => {
      const session = await Session.read();
      if (session.ledgerSyncTrustchain) {
        throw new Error(
          "Ledger Sync already enrolled. Run `wallet-cli ledger-sync destroy` to reset.",
        );
      }
      assertNoExistingCredential();

      const memberName = flags.name ?? defaultMemberName();
      const sdk = createLkrpSdk({
        memberName,
        applicationId: LEDGER_SYNC_APPLICATION_ID,
        environment: flags.environment,
      });

      const memberCredentials = await out.withActivity(
        "Generating member credentials…",
        "Member credentials created",
        () => sdk.initMemberCredentials(),
      );

      const deviceSpin = out.spin(
        "Connect device, open Ledger Sync app — enrolling/restoring Ledger Sync…",
      );
      const { trustchain } = await withLkrpDeviceSession(() =>
        sdk.getOrCreateTrustchain(WALLET_CLI_DMK_DEVICE_ID, memberCredentials),
      );
      deviceSpin?.success("Ledger Sync ready");

      await withSessionLock(async () => {
        const fresh = await Session.read();
        if (fresh.ledgerSyncTrustchain || ledgerSyncCredentialState() !== "absent") {
          // getOrCreateTrustchain above already registered this machine as a member remotely — that
          // can't be undone here, so say so rather than a plain "already enrolled".
          throw new Error(
            "Lost the race: another process enrolled Ledger Sync while this device was being " +
              "registered remotely. This machine was still added as a Ledger Sync member — remove it " +
              "from Ledger Live if you don't want it listed, then re-run `wallet-cli ledger-sync " +
              "enroll` if you still need it here.",
          );
        }
        persistEnrollment(
          fresh,
          memberCredentials,
          { rootId: trustchain.rootId, applicationPath: trustchain.applicationPath },
          flags.environment,
          memberName,
        );
      });

      out.ledgerSyncEnroll({ memberName, rootId: trustchain.rootId });
    });
  },
});
