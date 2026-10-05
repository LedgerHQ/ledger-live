import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { APP_NAME, Session, withSessionLock } from "../../session/session-store";
import { hasStoredKey } from "../../key-ring/keychain";
import { outputOption, resolveOutputFormat } from "../inputs";
import { createCommandOutput } from "../../output";
import { writeStderr } from "../../shared/ui";

export default defineCommand({
  name: "reset",
  description: "Wipe all accounts from the current session",
  options: {
    force: option(z.boolean().default(false), {
      description:
        "Overwrite an unparseable session file with an empty one (any Agent Intent profiles in " +
        "it are lost).",
      argumentKind: "flag",
    }),
    output: outputOption,
  },
  handler: async ({ flags }) => {
    const out = createCommandOutput(resolveOutputFormat(flags.output), {
      command: "session reset",
      network: "all",
    });

    await out.run(async () => {
      const count = await withSessionLock(async () => {
        let session: Session;
        try {
          // Preserves ring state even from a corrupt file, so resetting accounts never orphans the key.
          session = await Session.readForReset();
        } catch (err) {
          // An fs-level failure (e.g. EACCES) carries a `code` — rethrow it, don't mask it as an empty
          // session. A corrupt-but-parseable file never reaches this catch (readForReset salvages it);
          // only truly unparseable YAML does, and only past --force (see the error below for why).
          if (err && typeof err === "object" && "code" in err && typeof err.code === "string") {
            throw err;
          }
          if (!flags.force) {
            throw new Error(
              "Session file is invalid YAML and cannot be salvaged. Any Agent Intent profiles it held " +
                "cannot be recovered, and their OS-keychain secrets (if any) become orphaned — " +
                "`agent-intent enroll` will refuse to reuse those profile ids until you remove each " +
                "one's keychain entry by hand. Re-run `session reset --force` to overwrite the file " +
                "with an empty session anyway.",
              { cause: err },
            );
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
              `  Remove the "member-private-key-…" account under the "${APP_NAME}" keychain service manually, then re-run \`wallet-cli ring init\`.\n`,
          );
        }
        session.write(); // always write: fixes corrupt files too
        return count;
      });
      out.sessionReset(count);
    });
  },
});
