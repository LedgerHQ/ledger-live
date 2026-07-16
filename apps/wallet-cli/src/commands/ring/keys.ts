import { defineCommand } from "@bunli/core";
import { Session } from "../../session/session-store";
import { outputOption, resolveOutputFormat } from "../inputs";
import { createCommandOutput } from "../../output";
import { trackRingKeysViewed } from "../../analytics/ring-analytics";

export default defineCommand({
  name: "keys",
  description: "List the keys you've used on your Ledger Key Ring (local cache, no network).",
  options: {
    output: outputOption,
  },
  handler: async ({ flags }) => {
    const out = createCommandOutput(resolveOutputFormat(flags.output), {
      command: "ring keys",
      network: "all",
    });
    await out.run(async () => {
      const session = await Session.read();
      if (!session.trustchain) {
        throw new Error("Ledger Key Ring not initialized. Run `wallet-cli ring init` first.");
      }
      out.ringKeys(session.domains);
      trackRingKeysViewed({ keysCount: session.domains.length });
    });
  },
});
