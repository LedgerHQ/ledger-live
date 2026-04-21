import { defineCommand } from "@bunli/core";
import { Session } from "../../session/session-store";
import { outputOption } from "../inputs";
import { colors, writeStdout } from "../../shared/ui";
import { makeEnvelope } from "../../shared/response";
import { createCommandOutput } from "../../output";

export default defineCommand({
  name: "view",
  description: "Display all accounts stored in the current session",
  options: {
    output: outputOption,
  },
  handler: async ({ flags }) => {
    const out = createCommandOutput(flags.output, { command: "session view", network: "all" });

    await out.run(async () => {
      const { accounts } = await Session.read();

      if (flags.output === "json") {
        writeStdout(JSON.stringify(makeEnvelope("session view", "all", { accounts }), null, 2));
        return;
      }

      if (accounts.length === 0) {
        writeStdout(colors.dim("No accounts in session. Run `account discover` first."));
        return;
      }

      const maxLabel = Math.max(...accounts.map(e => e.label.length));
      for (const entry of accounts) {
        writeStdout(`${colors.bold(entry.label.padEnd(maxLabel))}  ${colors.dim(entry.descriptor)}`);
      }
    });
  },
});
