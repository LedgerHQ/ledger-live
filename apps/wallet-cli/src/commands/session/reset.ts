import { defineCommand } from "@bunli/core";
import { Session } from "../../session/session-store";
import { outputOption } from "../inputs";
import { createCommandOutput } from "../../output";

export default defineCommand({
  name: "reset",
  description: "Wipe all accounts from the current session",
  options: {
    output: outputOption,
  },
  handler: async ({ flags }) => {
    const out = createCommandOutput(flags.output, { command: "session reset", network: "all" });

    await out.run(async () => {
      let session: Session;
      try {
        session = await Session.read();
      } catch {
        // Corrupt session file — treat as empty and overwrite below
        session = Session.from([]);
      }
      const count = session.clear();
      await session.write(); // always write: fixes corrupt files too
      out.sessionReset(count);
    });
  },
});
