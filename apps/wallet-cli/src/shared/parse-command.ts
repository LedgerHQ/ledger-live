import { COMMANDS } from "../commands/registry";

/**
 * Extract the command path from raw CLI argv, stripping flags/options and any
 * positional values. Looks the first word up in the command registry, then the
 * second among that command's subcommands.
 *
 * e.g. `["swap", "execute", "--from", "eth"]` -> `"swap execute"`,
 * `["balances", "eth-1"]` -> `"balances"`, unknown/empty input -> `undefined`.
 */
export function parseCommand(argv: string[]): string | undefined {
  const [name, subcommand] = argv;
  const command = COMMANDS.find(entry => entry.name === name);
  if (!command) return undefined;
  return subcommand !== undefined && command.subcommands.includes(subcommand)
    ? `${command.name} ${subcommand}`
    : command.name;
}
