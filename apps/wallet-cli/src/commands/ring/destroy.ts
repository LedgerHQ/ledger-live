import { defineCommand } from "@bunli/core";
import { createInterface } from "node:readline";
import type { MemberCredentials } from "@ledgerhq/ledger-key-ring-protocol/types";
import { Session, trustchainFromMeta } from "../../session/session-store";
import { loadMemberCredentials, deletePrivateKey } from "../../key-ring/keychain";
import { createLkrpSdk } from "../../key-ring/lkrp-sdk";
import { deriveWrappingKey } from "../../key-ring/crypto";
import { promptHidden } from "../../key-ring/prompt";
import { outputOption, resolveOutputFormat } from "../inputs";
import { createCommandOutput } from "../../output";

async function readConfirmation(): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  return new Promise(resolve => {
    rl.question('Type "destroy" to confirm: ', answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

export default defineCommand({
  name: "destroy",
  description: "Tear down your Ledger Key Ring on LKRP and wipe local member credentials.",
  options: {
    output: outputOption,
  },
  handler: async ({ flags }) => {
    const out = createCommandOutput(resolveOutputFormat(flags.output), {
      command: "ring destroy",
      network: "all",
    });
    await out.run(async () => {
      const session = await Session.read();
      const trustchainMeta = session.trustchain;
      if (!trustchainMeta) {
        throw new Error("Nothing to destroy — Ledger Key Ring is not initialized.");
      }

      const answer = await readConfirmation();
      if (answer !== "destroy") {
        out.ringDestroyCancelled();
        return;
      }

      let wrappingKey: CryptoKey | undefined;
      if (session.passwordSalt) {
        try {
          const password = await promptHidden("Password (Enter to skip remote destroy): ");
          if (password) wrappingKey = await deriveWrappingKey(password, session.passwordSalt);
        } catch {
          // Ctrl-C or no-TTY/no-WALLET_PASS — proceed with local wipe only
        }
      }

      let memberCredentials: MemberCredentials | null = null;
      let credentialsError: string | undefined;
      try {
        memberCredentials = await loadMemberCredentials(wrappingKey);
      } catch (e) {
        credentialsError = e instanceof Error ? e.message : String(e);
      }

      const sdk = createLkrpSdk();
      const destroySpin = out.spin("Tearing down your Ledger Key Ring…");
      let remoteDestroySucceeded = false;
      if (memberCredentials) {
        try {
          const latest = await sdk.restoreTrustchain(
            trustchainFromMeta(trustchainMeta),
            memberCredentials,
          );
          const { trustchainDestroyed } = await sdk.destroyApplication(latest, memberCredentials);
          remoteDestroySucceeded = true;
          destroySpin?.success(
            trustchainDestroyed
              ? "Ledger Key Ring destroyed"
              : "wallet-cli application deactivated (Ledger Key Ring kept for other apps)",
          );
        } catch {
          destroySpin?.error("Remote teardown failed (continuing with local wipe)");
        }
      } else {
        destroySpin?.error(
          `${credentialsError ?? "No credentials found in keychain"} (continuing with local wipe)`,
        );
      }

      deletePrivateKey();
      session.wipeRing();
      session.write();
      out.ringDestroy(remoteDestroySucceeded);
    });
  },
});
