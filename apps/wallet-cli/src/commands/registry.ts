import type { CLI } from "@bunli/core";

// Whatever `cli.command()` accepts, whatever the command's own option types.
type LoadedCommand = Parameters<CLI["command"]>[0];

/**
 * A top-level command, described without loading its module, so root help, unknown-command
 * suggestions and analytics never need the implementation. The module takes its description
 * from here (`commandDescription`); `subcommands` must match its own list (registry.test.ts).
 */
export type CommandEntry = {
  name: string;
  description: string;
  subcommands: readonly string[];
  load: () => Promise<LoadedCommand>;
};

// Alphabetical: bunli lists top-level commands in registration order.
// Literal import() paths so `bun build --compile` bundles each command module.
export const COMMANDS: readonly CommandEntry[] = [
  {
    name: "account",
    description: "Account management commands",
    subcommands: ["discover"],
    load: () => import("./account/index").then(m => m.default),
  },
  {
    name: "agent-intent",
    description:
      "Enroll and manage Agent Intent profiles for AI agents proposing EVM payments for human review, and sync their Ledger Sync accounts.",
    subcommands: ["enroll", "recover", "list", "show", "send", "sync"],
    load: () => import("./agent-intent/index").then(m => m.default),
  },
  {
    name: "assets",
    description: "Crypto-assets store queries (resolve tokens by address or id)",
    subcommands: ["token", "token-by-id"],
    load: () => import("./assets/index").then(m => m.default),
  },
  {
    name: "balances",
    description: "Fetch native and token balances for an account (no device required)",
    subcommands: [],
    load: () => import("./balances").then(m => m.default),
  },
  {
    name: "earn",
    description: "Earn (staking & DeFi yield) commands",
    subcommands: ["yields", "positions", "deposit", "withdraw"],
    load: () => import("./earn/index").then(m => m.default),
  },
  {
    name: "genuine-check",
    description: "Check whether the connected Ledger device is genuine",
    subcommands: [],
    load: () => import("./genuine-check").then(m => m.default),
  },
  {
    name: "operations",
    description: "List operations for an account (no device required)",
    subcommands: [],
    load: () => import("./operations").then(m => m.default),
  },
  {
    name: "receive",
    description: "Get receive address for an account (optionally verify on device)",
    subcommands: [],
    load: () => import("./receive").then(m => m.default),
  },
  {
    name: "ring",
    description:
      "Ledger Key Ring — trustless, hardware-rooted encryption for files and text (LKRP)",
    subcommands: ["init", "encrypt", "decrypt", "keys", "destroy"],
    load: () => import("./ring/index").then(m => m.default),
  },
  {
    name: "send",
    description: "Sign and broadcast a transaction",
    subcommands: [],
    load: () => import("./send").then(m => m.default),
  },
  {
    name: "session",
    description: "Session management commands",
    subcommands: ["view", "reset"],
    load: () => import("./session/index").then(m => m.default),
  },
  {
    name: "skill",
    description: "Ledger wallet-cli agent skills (list, retrieve, install, doctor)",
    subcommands: ["list", "retrieve", "install", "doctor"],
    load: () => import("./skill/index").then(m => m.default),
  },
  {
    name: "swap",
    description: "Swap-related commands",
    subcommands: ["execute", "quote", "status"],
    load: () => import("./swap/index").then(m => m.default),
  },
];

// The manifests document every command's options, so they need every module.
const LOAD_ALL_FLAG = /^--llms(-full)?(=|$)/;

export function commandDescription(name: string): string {
  const entry = COMMANDS.find(command => command.name === name);
  if (!entry) throw new Error(`"${name}" is not in the command registry`);
  return entry.description;
}

/**
 * The commands to register for one invocation. Modules are loaded only for the commands
 * named in `argv` (before `--`); every other command is registered by name and description
 * alone. bunli matches a command only by names present in argv, so it never dispatches to
 * one of those placeholders.
 */
export async function loadCommands(
  argv: readonly string[],
  entries: readonly CommandEntry[] = COMMANDS,
): Promise<LoadedCommand[]> {
  const separator = argv.indexOf("--");
  const args = separator >= 0 ? argv.slice(0, separator) : argv;
  const loadAll = args.some(arg => LOAD_ALL_FLAG.test(arg));
  return Promise.all(
    entries.map(async entry =>
      loadAll || args.includes(entry.name)
        ? entry.load()
        : { name: entry.name, description: entry.description, commands: [] },
    ),
  );
}
