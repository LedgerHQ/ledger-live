import { defineCommand } from "@bunli/core";
import { Session } from "../../session/session-store";
import { outputOption, resolveOutputFormat } from "../inputs";
import { createCommandOutput } from "../../output";

export default defineCommand({
  name: "view",
  description: "Display all accounts stored in the current session",
  options: {
    output: outputOption,
  },
  handler: async ({ flags }) => {
    const out = createCommandOutput(resolveOutputFormat(flags.output), {
      command: "session view",
      network: "all",
    });

    await out.run(async () => {
      const { accounts } = await Session.read();
      out.sessionView(accounts);
    });
  },
});
