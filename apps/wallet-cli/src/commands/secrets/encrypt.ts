import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { loadDomainKeyInteractive } from "../../secrets/load-secrets";
import { encryptData } from "../../secrets/crypto";
import { outputOption, resolveOutputFormat, resolveUserPath } from "../inputs";
import { createCommandOutput } from "../../output";

export default defineCommand({
  name: "encrypt",
  description: "Encrypt data with a domain-scoped AES-256-GCM key",
  options: {
    key: option(z.string().min(1).max(253).regex(/^\S+$/, "domain key must not contain whitespace"), {
      description: "Domain name used to derive a scoped encryption key (e.g. openClaw-prod)",
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
    const out = createCommandOutput(format, { command: "secrets encrypt", network: "all" });
    await out.run(async () => {
      if (format === "json" && !flags.out) {
        throw new Error("--output json requires --out <file>: binary ciphertext cannot be written as JSON to stdout.");
      }
      if (!flags.input && process.stdin.isTTY) {
        throw new Error("No input: provide --input FILE or pipe data to stdin.");
      }

      const fetchSpin = out.spin("Fetching encryption key from trustchain…");
      const { session, domainKey } = await loadDomainKeyInteractive(flags.key);
      fetchSpin?.success("Encryption key retrieved");

      const plaintext = new Uint8Array(
        flags.input
          ? await Bun.file(resolveUserPath(flags.input)).arrayBuffer()
          : await Bun.stdin.arrayBuffer(),
      );
      const encSpin = out.spin(`Encrypting with domain "${flags.key}"…`);
      const ciphertext = await encryptData(domainKey, plaintext);
      encSpin?.success(`Encrypted (${ciphertext.byteLength} bytes, AES-256-GCM)`);

      if (flags.out) {
        const dest = resolveUserPath(flags.out);
        await Bun.write(dest, ciphertext);
        out.secretsEncrypt({ dest, bytes: ciphertext.byteLength });
      } else {
        process.stdout.write(Buffer.from(ciphertext));
      }

      session.trackDomain(flags.key);
      await session.write();
    });
  },
});
