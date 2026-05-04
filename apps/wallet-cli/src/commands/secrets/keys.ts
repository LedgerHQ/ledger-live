import { defineCommand } from "@bunli/core";
import { Session } from "../../session/session-store";
import { outputOption, resolveOutputFormat } from "../inputs";
import { createCommandOutput } from "../../output";

export default defineCommand({
  name: "keys",
  description: "List tracked domain keys from the local secrets store",
  options: {
    output: outputOption,
  },
  handler: async ({ flags }) => {
    const out = createCommandOutput(resolveOutputFormat(flags.output), { command: "secrets keys", network: "all" });
    await out.run(async () => {
      const session = await Session.read();
      if (!session.trustchain) {
        throw new Error("Encryption CLI not initialized. Run `wallet-cli secrets init` first.");
      }
      out.secretsKeys(session.domains);
    });
  },
});
