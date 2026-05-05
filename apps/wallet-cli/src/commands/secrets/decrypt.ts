import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { chmod } from "node:fs/promises";
import { loadDomainKeyInteractive } from "../../secrets/load-secrets";
import { decryptData } from "../../secrets/crypto";
import { outputOption, resolveOutputFormat, resolveUserPath } from "../inputs";
import { createCommandOutput } from "../../output";

export default defineCommand({
  name: "decrypt",
  description: "Decrypt data with a domain-scoped AES-256-GCM key",
  options: {
    key: option(z.string().min(1).max(253).regex(/^\S+$/, "domain key must not contain whitespace"), {
      description: "Domain name used to derive the scoped decryption key (e.g. openClaw-prod)",
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
    const out = createCommandOutput(format, { command: "secrets decrypt", network: "all" });
    await out.run(async () => {
      if (format === "json" && !flags.out) {
        throw new Error("--output json requires --out <file>: binary plaintext cannot be written as JSON to stdout.");
      }
      if (!flags.input && process.stdin.isTTY) {
        throw new Error("No input: provide --input FILE or pipe data to stdin.");
      }

      const fetchSpin = out.spin("Fetching encryption key from trustchain…");
      const { domainKey } = await loadDomainKeyInteractive(flags.key);
      fetchSpin?.success("Encryption key retrieved");

      const ciphertext = new Uint8Array(
        flags.input
          ? await Bun.file(resolveUserPath(flags.input)).arrayBuffer()
          : await Bun.stdin.arrayBuffer(),
      );
      const decSpin = out.spin(`Decrypting with domain "${flags.key}"…`);
      const plaintext = await decryptData(domainKey, ciphertext);
      decSpin?.success("Decrypted");

      if (flags.out) {
        const dest = resolveUserPath(flags.out);
        await Bun.write(dest, plaintext);
        await chmod(dest, 0o600).catch(() => {});
        out.secretsDecrypt({ dest });
      } else {
        process.stdout.write(Buffer.from(plaintext));
      }
    });
  },
});
