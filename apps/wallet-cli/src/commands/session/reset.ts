import { defineCommand } from "@bunli/core";
import { APP_NAME, InvalidSessionYamlError, Session } from "../../session/session-store";
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
        if (!(err instanceof InvalidSessionYamlError)) throw err;
        // TODO: Let users preserve and repair invalid YAML before resetting it.
        if (hasStoredKey()) {
          writeStderr(
            `⚠ The Ledger Key Ring metadata is missing but a credential remains in the OS keychain.\n` +
              `  Remote teardown is no longer possible from this machine.\n` +
              `  Remove the "member-private-key-…" account under the "${APP_NAME}" keychain service manually, then re-run \`wallet-cli ring init\`.\n`,
          );
        }
        session = Session.from([]);
      }
      const count = session.clear();
      session.write(); // always write: fixes corrupt files too
      out.sessionReset(count);
    });
  },
});
