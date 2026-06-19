import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { chmod } from "node:fs/promises";
import { loadDomainKeyInteractive } from "../../key-ring/load-key-ring";
import { encryptData } from "../../key-ring/crypto";
import { outputOption, resolveOutputFormat, resolveUserPath } from "../inputs";
import { createCommandOutput } from "../../output";

export default defineCommand({
  name: "encrypt",
  description:
    "Encrypt data with a key from your Ledger Key Ring. Files via -i/-o, text via stdin/stdout.",
  options: {
    key: option(z.string().min(1).max(253).regex(/^\S+$/, "key name must not contain whitespace"), {
      description:
        "Key name used to derive a scoped encryption key (e.g. my-oss-project, openClaw-prod)",
      short: "k",
    }),
    input: option(z.string().optional(), {
      description: "Input file (default: stdin)",
      short: "i",
    }),
    out: option(z.string().optional(), {
      description: "Output file (default: stdout)",
      short: "o",
    }),
    output: outputOption,
  },
  handler: async ({ flags }) => {
    const format = resolveOutputFormat(flags.output);
    const out = createCommandOutput(format, { command: "ring encrypt", network: "all" });
    await out.run(async () => {
      if (format === "json" && !flags.out) {
        throw new Error(
          "--output json requires --out <file>: binary ciphertext cannot be written as JSON to stdout.",
        );
      }
      if (!flags.input && process.stdin.isTTY) {
        throw new Error("No input: provide --input FILE or pipe data to stdin.");
      }

      const fetchSpin = out.spin("Fetching key from your Ledger Key Ring…");
      const { session, domainKey } = await loadDomainKeyInteractive(flags.key);
      fetchSpin?.success("Key retrieved");

      const plaintext = new Uint8Array(
        flags.input
          ? await Bun.file(resolveUserPath(flags.input)).arrayBuffer()
          : await Bun.stdin.arrayBuffer(),
      );
      const encSpin = out.spin(`Encrypting with key "${flags.key}"…`);
      const ciphertext = await encryptData(domainKey, plaintext);
      encSpin?.success(`Encrypted (${ciphertext.byteLength} bytes, AES-256-GCM)`);

      if (flags.out) {
        const dest = resolveUserPath(flags.out);
        await Bun.write(dest, ciphertext);
        await chmod(dest, 0o600).catch(() => {});
        out.ringEncrypt({ dest, bytes: ciphertext.byteLength });
      } else {
        process.stdout.write(Buffer.from(ciphertext));
      }

      session.trackDomain(flags.key);
      session.write();
    });
  },
});
