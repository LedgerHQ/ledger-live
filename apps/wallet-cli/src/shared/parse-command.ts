import type { GeneratedCommandMeta } from "@bunli/core";
import { commandMeta } from "../../.bunli/commands.gen";

/**
 * Extract the command path from raw CLI argv, stripping flags/options and any
 * positional values. Walks the command tree in `commandMeta`, descending into
 * subcommands as long as the next word matches a known one.
 *
 * e.g. `["swap", "execute", "--from", "eth"]` -> `"swap execute"`,
 * `["balances", "eth-1"]` -> `"balances"`, unknown/empty input -> `undefined`.
 */
export function parseCommand(argv: string[]): string | undefined {
  const parts: string[] = [];
  let candidates: readonly GeneratedCommandMeta[] = Object.values(commandMeta);

  for (const arg of argv) {
    if (arg.startsWith("-")) break;
    const match = candidates.find(c => c.name === arg);
    if (!match) break;
    parts.push(match.name);
    if (!match.commands?.length) break;
    candidates = match.commands;
  }

  return parts.length > 0 ? parts.join(" ") : undefined;
}
