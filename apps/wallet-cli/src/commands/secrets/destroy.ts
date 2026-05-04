import { defineCommand } from "@bunli/core";
import { createInterface } from "node:readline";
import { Session, trustchainFromMeta } from "../../session/session-store";
import { loadMemberCredentials, deletePrivateKey } from "../../secrets/keychain";
import { createLkrpSdk } from "../../secrets/lkrp-sdk";
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
  description: "Destroy the local trustchain membership and wipe credentials",
  options: {
    output: outputOption,
  },
  handler: async ({ flags }) => {
    const out = createCommandOutput(resolveOutputFormat(flags.output), { command: "secrets destroy", network: "all" });
    await out.run(async () => {
      const session = await Session.read();
      const trustchainMeta = session.trustchain;
      if (!trustchainMeta) {
        throw new Error("Nothing to destroy — encryption CLI is not initialized.");
      }

      const answer = await readConfirmation();
      if (answer !== "destroy") {
        out.secretsDestroyCancelled();
        return;
      }

      const memberCredentials = await loadMemberCredentials();
      const sdk = createLkrpSdk();
      const destroySpin = out.spin("Destroying trustchain…");
      let remoteDestroySucceeded = false;
      if (memberCredentials) {
        try {
          const latest = await sdk.restoreTrustchain(trustchainFromMeta(trustchainMeta), memberCredentials);
          await sdk.destroyTrustchain(latest, memberCredentials);
          remoteDestroySucceeded = true;
          destroySpin?.success("Trustchain destroyed");
        } catch {
          destroySpin?.error("Trustchain destroy failed (continuing with local wipe)");
        }
      } else {
        destroySpin?.error("No credentials found in keychain (continuing with local wipe)");
      }

      await deletePrivateKey();
      session.wipeSecrets();
      await session.write();
      out.secretsDestroy(remoteDestroySucceeded);
    });
  },
});
