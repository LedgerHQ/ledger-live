import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { Session } from "../../session/session-store";
import { loadDomainKey, resolveWrappingKey } from "../../key-ring/load-key-ring";
import { outputOption, resolveOutputFormat, resolveUserPath } from "../inputs";
import { writeSecureFile } from "../../shared/secure-file";
import { createCommandOutput, type CommandOutput } from "../../output";

export type RingCryptoOptions = {
  out: CommandOutput;
  format: "human" | "json";
  /** Key name used to derive the scoped domain key. */
  key: string;
  /** Input file path; when absent, data is read from stdin. */
  input?: string;
  /** Output file path; when absent, data is written to stdout. */
  outFile?: string;
  /** Error thrown when --output json is used without --out. */
  jsonRequiresOutMessage: string;
  /** Spinner label shown while transforming. */
  transformSpinLabel: string;
  /** Spinner success message, given the output byte length. */
  transformSuccess: (bytes: number) => string;
  /** encryptData or decryptData. */
  transform: (
    domainKey: CryptoKey,
    data: Uint8Array<ArrayBuffer>,
  ) => Promise<Uint8Array<ArrayBuffer>>;
  /** Emit the file-output result envelope (ring encrypt/decrypt differ only here). */
  onFileWritten: (dest: string, bytes: number) => void;
};

/**
 * Shared pipeline for `ring encrypt` and `ring decrypt`: guards, key fetch, input read, transform,
 * and secure file/stdout output. Both commands differ only in the transform and the output wording.
 */
export async function runRingCrypto(opts: RingCryptoOptions): Promise<{ newlyTracked: boolean }> {
  const { out, format, key } = opts;
  if (format === "json" && !opts.outFile) {
    throw new Error(opts.jsonRequiresOutMessage);
  }
  if (!opts.input && process.stdin.isTTY) {
    throw new Error("No input: provide --input FILE or pipe data to stdin.");
  }

  // Resolve the password before the spinner: both render on stderr, so an animating spinner would
  // clobber the "Password:" line. The spinner wraps only the network fetch inside loadDomainKey.
  const session = await Session.read();
  // Check init before resolveWrappingKey, which prompts whenever a salt is set: otherwise a
  // salt-without-trustchain file would ask for a password only to then report "not initialized".
  if (!session.trustchain) {
    throw new Error("Ledger Key Ring not initialized. Run `wallet-cli ring init` first.");
  }
  const wrappingKey = await resolveWrappingKey(session);

  const fetchSpin = out.spin("Fetching key from your Ledger Key Ring…");
  const { domainKey } = await loadDomainKey(key, wrappingKey, session);
  fetchSpin?.success("Key retrieved");

  const inputBytes = new Uint8Array(
    opts.input
      ? await Bun.file(resolveUserPath(opts.input)).arrayBuffer()
      : await Bun.stdin.arrayBuffer(),
  );
  const spin = out.spin(opts.transformSpinLabel);
  const output = await opts.transform(domainKey, inputBytes);
  spin?.success(opts.transformSuccess(output.byteLength));

  if (opts.outFile) {
    const dest = resolveUserPath(opts.outFile);
    // Atomic 0600 write (see writeSecureFile); Bun.write has no mode option.
    writeSecureFile(dest, Buffer.from(output));
    opts.onFileWritten(dest, output.byteLength);
  } else {
    process.stdout.write(Buffer.from(output));
  }

  // Persist only when the key was newly tracked; a repeat with an already-tracked key changes nothing.
  const newlyTracked = session.trackDomain(key);
  if (newlyTracked) session.write();
  return { newlyTracked };
}

/** Per-command differences between `ring encrypt` and `ring decrypt`; everything else is shared. */
export type RingCryptoCommandConfig = {
  name: "encrypt" | "decrypt";
  description: string;
  /** Help text for the --key option. */
  keyDescription: string;
  /** Error thrown when --output json is used without --out. */
  jsonRequiresOutMessage: string;
  /** encryptData or decryptData. */
  transform: RingCryptoOptions["transform"];
  /** Spinner label shown while transforming, given the key name. */
  transformSpinLabel: (key: string) => string;
  /** Spinner success message, given the output byte length. */
  transformSuccess: (bytes: number) => string;
  /** Emit the file-output result envelope. */
  onFileWritten: (out: CommandOutput, dest: string, bytes: number) => void;
  /** Privacy-safe analytics for the run; `newlyTracked` is only meaningful for encrypt. */
  track: (flags: { input?: string; out?: string }, newlyTracked: boolean) => void;
};

/**
 * Builds a `ring encrypt` / `ring decrypt` command. Both share the same options and pipeline
 * (see {@link runRingCrypto}) and differ only in the transform, wording, and analytics.
 */
export function defineRingCryptoCommand(cfg: RingCryptoCommandConfig) {
  return defineCommand({
    name: cfg.name,
    description: cfg.description,
    options: {
      key: option(
        z.string().min(1).max(253).regex(/^\S+$/, "key name must not contain whitespace"),
        { description: cfg.keyDescription, short: "k" },
      ),
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
      const out = createCommandOutput(format, { command: `ring ${cfg.name}`, network: "all" });
      await out.run(async () => {
        const { newlyTracked } = await runRingCrypto({
          out,
          format,
          key: flags.key,
          input: flags.input,
          outFile: flags.out,
          jsonRequiresOutMessage: cfg.jsonRequiresOutMessage,
          transformSpinLabel: cfg.transformSpinLabel(flags.key),
          transformSuccess: cfg.transformSuccess,
          transform: cfg.transform,
          onFileWritten: (dest, bytes) => cfg.onFileWritten(out, dest, bytes),
        });
        cfg.track(flags, newlyTracked);
      });
    },
  });
}
