/**
 * Strict argv preflight — reject unknown flags before bunli parses them.
 *
 * bunli silently drops flags it does not recognize, which on a signing CLI is
 * dangerous: a typo'd `send --dryrun` would skip the intended `--dry-run` preview
 * and proceed to a live sign-and-broadcast. `assertKnownFlags` resolves the
 * command path the way bunli's own lookup does (deepest matching prefix after
 * stripping recognized global flags) and validates every flag token against that
 * command's generated option manifest (.bunli/commands.gen.ts), honoring short
 * aliases, `--flag=value`, the `--no-<flag>` negation that cli.ts rewrites, and
 * everything after a `--` separator being passthrough.
 *
 * Unknown commands are deliberately not reported here: bunli already renders a
 * command-not-found error listing the available commands, and reporting an
 * unknown flag on top of it would misattribute the problem.
 */

import type { GeneratedCommandMeta } from "@bunli/core";
import { commandMeta } from "../../.bunli/commands.gen";
import { WalletCliError } from "./wallet-cli-error";

/**
 * bunli's built-in global flags (@bunli/core GLOBAL_FLAGS), mirrored here so
 * command lookup matches bunli's: recognized globals (and the value they consume)
 * are skipped when locating the command path. Boolean globals only consume a
 * literal `true`/`false` value; valued globals consume any non-flag token.
 */
const BUNLI_GLOBAL_FLAGS: Record<string, { takesValue: boolean; short?: string }> = {
  help: { takesValue: false, short: "h" },
  version: { takesValue: false, short: "v" },
  llms: { takesValue: false },
  "llms-full": { takesValue: false },
  format: { takesValue: true },
  "image-mode": { takesValue: true },
};

/**
 * Globals an invocation may pass on any command. Deliberately narrower than
 * BUNLI_GLOBAL_FLAGS: `--format`/`--image-mode` only affect bunli's framework
 * rendering, never the wallet-cli envelope, so accepting them would let
 * `--format json` silently masquerade as `--output json`.
 */
const ALLOWED_GLOBAL_FLAGS = ["help", "version", "llms", "llms-full"] as const;
const ALLOWED_GLOBAL_SHORTS = ["h", "v"] as const;

/** Suggest a flag only when it is this close (Levenshtein) to what was typed. */
const MAX_SUGGESTION_DISTANCE = 2;

let pathTable: Map<string, GeneratedCommandMeta> | null = null;

/** Flat `"group sub"` path → metadata table built from the generated manifest. */
function getPathTable(): Map<string, GeneratedCommandMeta> {
  if (!pathTable) {
    pathTable = new Map();
    for (const meta of Object.values(commandMeta)) {
      addCommandPaths(pathTable, meta, "");
    }
  }
  return pathTable;
}

function addCommandPaths(
  table: Map<string, GeneratedCommandMeta>,
  meta: GeneratedCommandMeta,
  prefix: string,
): void {
  const path = prefix ? `${prefix} ${meta.name}` : meta.name;
  table.set(path, meta);
  for (const sub of meta.commands ?? []) {
    addCommandPaths(table, sub, path);
  }
}

/** Args before the `--` separator; everything after it is passthrough, never validated. */
function argsBeforeSeparator(argv: readonly string[]): string[] {
  const separatorIndex = argv.indexOf("--");
  return separatorIndex >= 0 ? argv.slice(0, separatorIndex) : [...argv];
}

/** Whether a recognized global flag consumes the following token as its value (bunli's rule). */
function consumesNextToken(flag: { takesValue: boolean }, next: string | undefined): boolean {
  if (next == null || next.startsWith("-")) {
    return false;
  }
  return flag.takesValue || next === "true" || next === "false";
}

/** Mirror of bunli's stripRecognizedGlobalFlags: drop globals (and their values) for command lookup. */
function stripBunliGlobalFlags(args: readonly string[]): string[] {
  const lookup: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    let flag: { takesValue: boolean } | undefined;
    if (arg.startsWith("--")) {
      const eqIndex = arg.indexOf("=");
      const name = eqIndex > 0 ? arg.slice(2, eqIndex) : arg.slice(2);
      flag = BUNLI_GLOBAL_FLAGS[name];
      if (flag && eqIndex < 0 && consumesNextToken(flag, args[i + 1])) {
        i += 1;
      }
    } else if (arg.startsWith("-") && arg.length > 1) {
      const short = arg.slice(1);
      const entry = Object.values(BUNLI_GLOBAL_FLAGS).find(option => option.short === short);
      flag = entry;
      if (entry && consumesNextToken(entry, args[i + 1])) {
        i += 1;
      }
    }
    if (!flag) {
      lookup.push(arg);
    }
  }
  return lookup;
}

type ResolvedCommand = {
  path: string;
  meta: GeneratedCommandMeta;
  remaining: string[];
};

/** Mirror of bunli's findCommand: deepest matching prefix of the global-stripped args. */
function resolveCommand(args: readonly string[]): ResolvedCommand | null {
  const lookup = stripBunliGlobalFlags(args);
  const table = getPathTable();
  for (let i = lookup.length; i > 0; i--) {
    const path = lookup.slice(0, i).join(" ");
    const meta = table.get(path);
    if (meta) {
      return { path, meta, remaining: lookup.slice(i) };
    }
  }
  return null;
}

/**
 * The command path bunli would resolve for this argv, or null when none matches.
 * Used by cli.ts to fill the `command` field of pre-command error envelopes.
 */
export function resolveCommandPath(argv: readonly string[]): string | null {
  return resolveCommand(argsBeforeSeparator(argv))?.path ?? null;
}

type KnownFlags = {
  longNames: Set<string>;
  shortNames: Set<string>;
};

function knownFlagsFor(meta: GeneratedCommandMeta): KnownFlags {
  const longNames = new Set<string>(ALLOWED_GLOBAL_FLAGS);
  const shortNames = new Set<string>(ALLOWED_GLOBAL_SHORTS);
  for (const [name, option] of Object.entries(meta.options ?? {})) {
    longNames.add(name);
    if (option.short) {
      shortNames.add(option.short);
    }
  }
  return { longNames, shortNames };
}

/** Classic two-row Levenshtein distance, used for "did you mean" flag suggestions. */
function levenshtein(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = row[0]!;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const insertOrDelete = Math.min(row[j]!, row[j - 1]!) + 1;
      const substitute = diagonal + (a[i - 1] === b[j - 1] ? 0 : 1);
      diagonal = row[j]!;
      row[j] = Math.min(insertOrDelete, substitute);
    }
  }
  return row[b.length]!;
}

function closestFlagName(name: string, candidates: ReadonlySet<string>): string | null {
  let best: string | null = null;
  let bestDistance = MAX_SUGGESTION_DISTANCE + 1;
  for (const candidate of candidates) {
    const distance = levenshtein(name, candidate);
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return best;
}

function unknownFlagError(
  flag: string,
  name: string,
  command: string,
  knownLongNames: ReadonlySet<string>,
): WalletCliError {
  const suggestion = closestFlagName(name, knownLongNames);
  return new WalletCliError("unknown_flag", `Unknown flag "${flag}" for \`${command}\`.`, {
    hint: suggestion
      ? `Did you mean --${suggestion}?`
      : `Run \`wallet-cli ${command} --help\` to list supported flags.`,
    details: { flag, command },
  });
}

/**
 * Throw a WalletCliError("unknown_flag", exit 64) when argv carries a flag the
 * resolved command does not declare. No-op when no known command resolves (bunli
 * reports command-not-found itself) and for everything after a `--` separator.
 */
export function assertKnownFlags(argv: readonly string[]): void {
  const args = argsBeforeSeparator(argv);
  const resolved = resolveCommand(args);
  if (!resolved) {
    return;
  }
  const { path, meta, remaining } = resolved;
  // A group invoked with an unrecognized subcommand (e.g. `swap frobnicate`):
  // bunli reports command-not-found; flag validation would misattribute it.
  if (meta.commands != null && remaining.some(arg => !arg.startsWith("-"))) {
    return;
  }

  const known = knownFlagsFor(meta);
  for (const arg of args) {
    if (!arg.startsWith("-") || arg === "-") {
      continue; // positional (command path tokens, account labels, flag values)
    }
    const eqIndex = arg.indexOf("=");
    if (arg.startsWith("--")) {
      const name = eqIndex > 0 ? arg.slice(2, eqIndex) : arg.slice(2);
      if (known.longNames.has(name)) {
        continue;
      }
      // `--no-<flag>` negation: cli.ts normalizeNegatedFlags rewrites it to `--<flag>=false`.
      if (name.startsWith("no-") && known.longNames.has(name.slice(3))) {
        continue;
      }
      throw unknownFlagError(`--${name}`, name, path, known.longNames);
    }
    const short = eqIndex > 0 ? arg.slice(1, eqIndex) : arg.slice(1);
    if (!known.shortNames.has(short)) {
      throw unknownFlagError(`-${short}`, short, path, known.longNames);
    }
  }
}
