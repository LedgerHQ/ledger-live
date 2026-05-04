import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import os from "node:os";
import { Session } from "../../session/session-store";
import { createLkrpSdk } from "../../secrets/lkrp-sdk";
import { savePrivateKey } from "../../secrets/keychain";
import { WALLET_CLI_DMK_DEVICE_ID } from "../../device/register-dmk-transport";
import { withLkrpDeviceSession } from "../../session/bridge-device-session";
import { MEMBER_NAME_MAX_LENGTH } from "../../secrets/constants";
import { outputOption, resolveOutputFormat } from "../inputs";
import { createCommandOutput } from "../../output";

function defaultMemberName(): string {
  const raw = `${os.hostname()} (${os.platform()})`;
  return raw.slice(0, MEMBER_NAME_MAX_LENGTH);
}

export default defineCommand({
  name: "init",
  description: "Register this machine as a trustchain member (device required)",
  options: {
    name: option(z.string().min(1).max(MEMBER_NAME_MAX_LENGTH).optional(), {
      description: `Member name (default: hostname + platform, max ${MEMBER_NAME_MAX_LENGTH} chars)`,
      short: "n",
    }),
    output: outputOption,
  },
  handler: async ({ flags }) => {
    const out = createCommandOutput(resolveOutputFormat(flags.output), { command: "secrets init", network: "all" });
    await out.run(async () => {
      const session = await Session.read();
      if (session.trustchain) {
        throw new Error(
          "Encryption CLI already initialized. Run `wallet-cli secrets destroy` to reset.",
        );
      }

      const memberName = flags.name ?? defaultMemberName();
      const sdk = createLkrpSdk(memberName);

      const memberCredentials = await out.withActivity(
        "Generating member credentials…",
        "Member credentials created",
        () => sdk.initMemberCredentials(),
      );

      const deviceSpin = out.spin("Connect device, open Ledger Sync app — creating trustchain…");
      const { trustchain } = await withLkrpDeviceSession(() =>
        sdk.getOrCreateTrustchain(WALLET_CLI_DMK_DEVICE_ID, memberCredentials),
      );
      deviceSpin?.success("Trustchain created");

      await savePrivateKey(memberCredentials.privatekey, memberCredentials.pubkey);
      session.setTrustchain({
        rootId: trustchain.rootId,
        applicationPath: trustchain.applicationPath,
      });
      await session.write();

      out.secretsInit({ memberName, rootId: trustchain.rootId });
    });
  },
});
