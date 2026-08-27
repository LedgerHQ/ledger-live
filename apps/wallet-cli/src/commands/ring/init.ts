import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import os from "node:os";
import { Session } from "../../session/session-store";
import { createLkrpSdk } from "../../key-ring/lkrp-sdk";
import { getOrCreateMemberCredentials } from "../../key-ring/member-credentials";
import { generatePasswordSalt, deriveWrappingKey } from "../../key-ring/crypto";
import { promptHidden } from "../../key-ring/prompt";
import { WALLET_CLI_DMK_DEVICE_ID } from "../../device/register-dmk-transport";
import { withLkrpDeviceSession } from "../../session/bridge-device-session";
import { MEMBER_NAME_MAX_LENGTH } from "../../key-ring/constants";
import { outputOption, resolveOutputFormat } from "../inputs";
import { createCommandOutput } from "../../output";
import { trackRingInitStarted, trackRingInitCompleted } from "../../analytics/ring-analytics";

function defaultMemberName(): string {
  const raw = `${os.hostname()} (${os.platform()})`;
  return raw.slice(0, MEMBER_NAME_MAX_LENGTH);
}

export default defineCommand({
  name: "init",
  description:
    "Set up this machine as a Ledger Key Ring member, creating or recovering a trustchain (device required).",
  options: {
    name: option(z.string().min(1).max(MEMBER_NAME_MAX_LENGTH).optional(), {
      description: `Member name (default: hostname + platform, max ${MEMBER_NAME_MAX_LENGTH} chars)`,
      short: "n",
    }),
    "unsecure-no-password": option(z.boolean().default(false), {
      description: "Skip password protection (stores private key unencrypted in the OS keychain)",
      argumentKind: "flag",
    }),
    output: outputOption,
  },
  handler: async ({ flags }) => {
    const out = createCommandOutput(resolveOutputFormat(flags.output), {
      command: "ring init",
      network: "all",
    });
    await out.run(async () => {
      const session = await Session.read();
      if (session.trustchain) {
        throw new Error(
          "Ledger Key Ring already initialized. Run `wallet-cli ring destroy` to reset.",
        );
      }

      trackRingInitStarted({
        passwordProtected: !flags["unsecure-no-password"],
        usedCustomName: !!flags.name,
      });

      let wrappingKey: CryptoKey | undefined;
      let passwordSalt: string | undefined;

      if (!flags["unsecure-no-password"]) {
        const { value: password } = await promptHidden("Password: ");
        if (!password) throw new Error("Password must not be empty.");
        const { value: confirm } = await promptHidden("Confirm password: ");
        if (password !== confirm) throw new Error("Passwords do not match.");
        passwordSalt = session.passwordSalt ?? generatePasswordSalt();
        wrappingKey = await deriveWrappingKey(password, passwordSalt);
      }

      const memberName = flags.name ?? defaultMemberName();
      const sdk = createLkrpSdk(memberName);

      const memberCredentials = await out.withActivity(
        "Preparing member credentials…",
        "Member credentials ready",
        () =>
          getOrCreateMemberCredentials({
            wrappingKey,
            createMemberCredentials: () => sdk.initMemberCredentials(),
            beforePersistCreated: passwordSalt
              ? () => {
                  session.setPasswordSalt(passwordSalt);
                  session.write();
                }
              : undefined,
          }),
      );

      if (flags["unsecure-no-password"] && session.passwordSalt) {
        session.clearPasswordSalt();
        session.write();
      }

      const deviceSpin = out.spin(
        "Connect device, open Ledger Sync app — provisioning your Ledger Key Ring…",
      );
      const { trustchain } = await withLkrpDeviceSession(() =>
        sdk.getOrCreateTrustchain(WALLET_CLI_DMK_DEVICE_ID, memberCredentials),
      );
      deviceSpin?.success("Ledger Key Ring ready");

      session.setTrustchain({
        rootId: trustchain.rootId,
        applicationPath: trustchain.applicationPath,
      });
      session.write();

      out.ringInit({ memberName, rootId: trustchain.rootId });
      trackRingInitCompleted({ passwordProtected: !!passwordSalt });
    });
  },
});
