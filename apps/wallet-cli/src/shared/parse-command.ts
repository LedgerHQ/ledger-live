import { findInvokedCommand } from "../commands/registry";

/**
 * Extract the command path from raw CLI argv, stripping flags/options and any
 * positional values. Finds the invoked command the way `loadCommands` does, then
 * looks the next word up among that command's subcommands.
 *
 * e.g. `["swap", "execute", "--from", "eth"]` -> `"swap execute"`,
 * `["--format", "json", "swap", "quote"]` -> `"swap quote"`,
 * `["balances", "eth-1"]` -> `"balances"`, unknown/empty input -> `undefined`.
 */
export function parseCommand(argv: string[]): string | undefined {
  const invoked = findInvokedCommand(argv);
  if (!invoked) return undefined;
  const { entry, index } = invoked;
  const subcommand = argv[index + 1];
  return subcommand !== undefined && entry.subcommands.includes(subcommand)
    ? `${entry.name} ${subcommand}`
    : entry.name;
}
