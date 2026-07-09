import { defineCommand } from "@bunli/core";
import { APP_NAME, Session } from "../../session/session-store";
import { hasStoredKey } from "../../key-ring/keychain";
import { outputOption, resolveOutputFormat } from "../inputs";
import { createCommandOutput } from "../../output";
import { writeStderr } from "../../shared/ui";

export default defineCommand({
  name: "reset",
  description: "Wipe all accounts from the current session",
  options: {
    output: outputOption,
  },
  handler: async ({ flags }) => {
    const out = createCommandOutput(resolveOutputFormat(flags.output), {
      command: "session reset",
      network: "all",
    });

    await out.run(async () => {
      let session: Session;
      try {
        // Preserves ring state even from a corrupt file, so resetting accounts never orphans the key.
        session = await Session.readForReset();
      } catch (err) {
        // A real read failure (e.g. EACCES) carries an fs `code` — rethrow it rather than masking it
        // by overwriting with a fresh session. Only invalid/unsalvageable YAML is safe to treat as
        // empty and start clean; the orphan check below still warns.
        if (err && typeof err === "object" && "code" in err && typeof err.code === "string") {
          throw err;
        }
        session = Session.from([]);
      }
      const count = session.clear();
      // Warn whenever a key would be orphaned: a malformed trustchain is salvaged to undefined
      // without throwing, yet the write below still drops the ring metadata.
      if (!session.trustchain && hasStoredKey()) {
        writeStderr(
          `⚠ The Ledger Key Ring metadata is missing but a credential remains in the OS keychain.\n` +
            `  Remote teardown is no longer possible from this machine.\n` +
            `  Remove the "${APP_NAME}" keychain entry manually, then re-run \`wallet-cli ring init\`.\n`,
        );
      }
      session.write(); // always write: fixes corrupt files too
      out.sessionReset(count);
    });
  },
});
