import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { GLOBAL_FLAGS } from "@bunli/core";
import { COMMANDS } from "../commands/registry";
import { SKILLS } from "./manifest.gen";

// An agent runs the docs literally, so every `wallet-cli` command and flag named by the shipped
// skill and the agent plugin docs must exist in this wallet-cli. A flag renamed without its docs
// fails here instead of on the user's machine.

type CommandNode = {
  name: string;
  options?: Record<string, unknown>;
  commands?: readonly CommandNode[];
};

type Surface = {
  // Flags of each runnable command, keyed by its words, e.g. "agent-intent enroll".
  flags: Map<string, Set<string>>;
  // Commands that only group subcommands, e.g. "agent-intent".
  groups: Set<string>;
};

const GLOBAL = ["--help", ...Object.keys(GLOBAL_FLAGS).map(name => `--${name}`)];
const PLUGIN_DIR = path.resolve(import.meta.dir, "../../agent-plugin");

async function loadSurface(): Promise<Surface> {
  const surface: Surface = { flags: new Map(), groups: new Set() };
  const visit = (node: CommandNode, parent: string) => {
    const key = parent ? `${parent} ${node.name}` : node.name;
    if (node.commands?.length) {
      surface.groups.add(key);
      for (const sub of node.commands) visit(sub, key);
      return;
    }
    const own = Object.keys(node.options ?? {}).map(name => `--${name}`);
    surface.flags.set(key, new Set([...GLOBAL, ...own]));
  };
  for (const entry of COMMANDS) visit(await entry.load(), "");
  return surface;
}

// `--no-<flag>` is the negation of a boolean `--<flag>`.
function knows(flags: Set<string>, flag: string): boolean {
  return flags.has(flag) || flags.has(flag.replace(/^--no-/, "--"));
}

// Lines continued with `\` are joined and numbered by their first line.
function logicalLines(text: string): [number, string][] {
  const lines: [number, string][] = [];
  let start = 0;
  let buffer = "";
  text.split("\n").forEach((raw, index) => {
    start ||= index + 1;
    if (raw.endsWith("\\")) {
      buffer += `${raw.slice(0, -1)} `;
      return;
    }
    lines.push([start, buffer + raw]);
    start = 0;
    buffer = "";
  });
  return lines;
}

const INVOCATION = /(?<![\w-])wallet-cli((?: [a-z][a-z0-9-]*)+)([^`|\n#]*)/g;
const FLAG = /(?<![\w-])--[a-z][a-z0-9-]*/g;

function checkInvocations(file: string, text: string, surface: Surface): string[] {
  const errors: string[] = [];
  let inFence = false;
  for (const [lineno, line] of logicalLines(text)) {
    if (line.trimStart().startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    // Code only: fenced blocks, or inline spans that start with `wallet-cli `.
    const spans = inFence
      ? [line]
      : [...line.matchAll(/`(wallet-cli [^`]*)`/g)].map(m => m[1] ?? "");
    for (const span of spans) {
      for (const match of span.matchAll(INVOCATION)) {
        const words = (match[1] ?? "").trim().split(" ");
        const where = `${file}:${lineno}`;
        let command = "";
        for (const word of words) {
          const next = command ? `${command} ${word}` : word;
          if (!surface.groups.has(next) && !surface.flags.has(next)) break;
          command = next;
        }
        if (!command) {
          errors.push(`${where}: unknown command \`wallet-cli ${words.join(" ")}\``);
          continue;
        }
        const flags = surface.flags.get(command);
        if (!flags) {
          const extra = words[command.split(" ").length];
          if (extra) errors.push(`${where}: \`${command}\` has no subcommand \`${extra}\``);
          continue;
        }
        for (const [flag] of (match[2] ?? "").matchAll(FLAG)) {
          if (!knows(flags, flag)) errors.push(`${where}: \`${command}\` has no ${flag}`);
        }
      }
    }
  }
  return errors;
}

// Flags named in skill prose must exist: on some agent-intent subcommand for agent-intent.md,
// on any command elsewhere.
function checkProseFlags(file: string, text: string, surface: Surface): string[] {
  const agentIntentOnly = file.endsWith("references/agent-intent.md");
  const known = new Set(
    [...surface.flags]
      .filter(([command]) => !agentIntentOnly || command.startsWith("agent-intent "))
      .flatMap(([, flags]) => [...flags]),
  );
  const scope = agentIntentOnly ? "agent-intent command" : "command";
  return text.split("\n").flatMap((line, index) =>
    [...line.matchAll(/`(--[a-z][a-z0-9-]*)/g)]
      .map(m => m[1] ?? "")
      .filter(flag => !knows(known, flag))
      .map(flag => `${file}:${index + 1}: no ${scope} has ${flag}`),
  );
}

const surface = await loadSurface();

const skillFiles = SKILLS.flatMap(skill =>
  skill.files.map(file => ({ file: `${skill.name}/${file.path}`, text: file.content })),
);
const pluginDocs = ["README.md", "tests/grokbot-smoke.md"].map(rel => ({
  file: `agent-plugin/${rel}`,
  text: readFileSync(path.join(PLUGIN_DIR, rel), "utf8"),
}));

describe("documented wallet-cli commands and flags", () => {
  it("reads the shipped skill with its references", () => {
    expect(skillFiles.map(({ file }) => file)).toContain(
      "wallet-cli-usage/references/agent-intent.md",
    );
  });

  it("exist for every invocation in the skill and the agent plugin docs", () => {
    const errors = [...skillFiles, ...pluginDocs].flatMap(({ file, text }) =>
      checkInvocations(file, text, surface),
    );
    expect(errors).toEqual([]);
  });

  it("exist for every flag the skill prose names", () => {
    const errors = skillFiles.flatMap(({ file, text }) => checkProseFlags(file, text, surface));
    expect(errors).toEqual([]);
  });

  it("are reported when this wallet-cli lacks them", () => {
    const doc = [
      "`wallet-cli send ethereum-1 --bogus-flag`",
      "`wallet-cli agent-intent bogus`",
      "```bash",
      "wallet-cli nope",
      "```",
    ].join("\n");
    expect(checkInvocations("doc.md", doc, surface)).toEqual([
      "doc.md:1: `send` has no --bogus-flag",
      "doc.md:2: `agent-intent` has no subcommand `bogus`",
      "doc.md:4: unknown command `wallet-cli nope`",
    ]);
    expect(
      checkProseFlags("s/references/agent-intent.md", "Pass `--fee-per-byte`.", surface),
    ).toEqual(["s/references/agent-intent.md:1: no agent-intent command has --fee-per-byte"]);
  });
});
