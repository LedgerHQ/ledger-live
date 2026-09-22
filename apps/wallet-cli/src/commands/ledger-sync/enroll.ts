import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import os from "node:os";
import { Session } from "../../session/session-store";
import { createLkrpSdk } from "../../key-ring/lkrp-sdk";
import {
  LEDGER_SYNC_APPLICATION_ID,
  LEDGER_SYNC_ENVIRONMENTS,
  MEMBER_NAME_MAX_LENGTH,
} from "../../key-ring/constants";
import {
  saveLedgerSyncMemberCredentials,
  hasLedgerSyncMemberCredentials,
} from "../../ledger-sync/keychain";
import { WALLET_CLI_DMK_DEVICE_ID } from "../../device/register-dmk-transport";
import { withLkrpDeviceSession } from "../../session/bridge-device-session";
import { outputOption, resolveOutputFormat } from "../inputs";
import { createCommandOutput } from "../../output";

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
      // Mirrors ring/init.ts: refuse a stray keychain key with no session metadata (e.g. after a
      // `session reset` on a corrupt file) — overwriting it would orphan the previous remote member.
      if (hasLedgerSyncMemberCredentials()) {
        throw new Error(
          "A Ledger Sync member credential already exists in the OS keychain but this session has " +
            "no Ledger Sync metadata. Run `wallet-cli ledger-sync destroy` (or remove the keychain " +
            "entry) before re-enrolling.",
        );
      }

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

      saveLedgerSyncMemberCredentials(memberCredentials);
      session.setLedgerSyncTrustchain(
        {
          rootId: trustchain.rootId,
          applicationPath: trustchain.applicationPath,
        },
        flags.environment,
      );
      session.write();

      out.ledgerSyncEnroll({ memberName, rootId: trustchain.rootId });
    });
  },
});
