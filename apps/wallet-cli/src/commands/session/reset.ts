import { defineCommand } from "@bunli/core";
import { Session } from "../../session/session-store";
import { outputOption } from "../inputs";
import { colors, writeStdout } from "../../shared/ui";
import { makeEnvelope } from "../../shared/response";
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

      if (flags.output === "json") {
        writeStdout(JSON.stringify(makeEnvelope("session reset", "all", { removed: count }), null, 2));
        return;
      }

      const suffix = count === 1 ? "" : "s";
      writeStdout(
        count === 0
          ? colors.dim("Session was already empty.")
          : `Removed ${colors.bold(String(count))} account${suffix} from session.`,
      );
    });
  },
});
