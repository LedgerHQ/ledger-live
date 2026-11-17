import { describe, it, expect } from "bun:test";
import pkg from "../package.json" with { type: "json" };
import { runCli, type RunResult } from "./testing/cli-runner";

type HelpData = { type: string; path: string[]; text: string };

function parseHelp(res: RunResult): HelpData {
  expect(res.exitCode).toBe(0);
  const envelope = JSON.parse(res.stdout) as { ok: boolean; data: HelpData };
  expect(envelope.ok).toBe(true);
  expect(envelope.data.type).toBe("help");
  return envelope.data;
}

// Names listed under a help section ("Commands:", "Subcommands:", "Options:").
function sectionNames(text: string, section: string): string[] {
  const body = text.split(`${section}:\n`)[1] ?? "";
  return [...body.matchAll(/^ {2}(\S+)/gm)].map(match => match[1].replace(/,$/, ""));
}

const TOP_LEVEL_COMMANDS = [
  "account",
  "agent-intent",
  "assets",
  "balances",
  "earn",
  "genuine-check",
  "operations",
  "receive",
  "ring",
  "send",
  "session",
  "skill",
  "swap",
];

describe("wallet-cli --version", () => {
  it.each([["--version"], ["-v"]])("%s prints the package version", async flag => {
    const res = await runCli([flag]);
    expect(res.exitCode).toBe(0);
    expect(JSON.parse(res.stdout)).toEqual({
      ok: true,
      data: { type: "version", name: "wallet-cli", version: pkg.version },
    });
  });
});

describe("wallet-cli --help", () => {
  it.each([[["--help"]], [["-h"]], [[]]])("%j lists every command in order", async args => {
    const help = parseHelp(await runCli(args));
    expect(help.path).toEqual([]);
    expect(sectionNames(help.text, "Commands")).toEqual(TOP_LEVEL_COMMANDS);
    expect(help.text).toContain("session        Session management commands");
  });

  it.each([[["swap", "--help"]], [["--help", "swap"]], [["swap"]]])(
    "%j lists the group's subcommands",
    async args => {
      const help = parseHelp(await runCli(args));
      expect(help.path).toEqual(["swap"]);
      expect(sectionNames(help.text, "Subcommands")).toEqual(["execute", "quote", "status"]);
    },
  );

  it("lists ring subcommands built by a factory", async () => {
    const help = parseHelp(await runCli(["ring", "--help"]));
    expect(sectionNames(help.text, "Subcommands")).toEqual([
      "init",
      "encrypt",
      "decrypt",
      "keys",
      "destroy",
    ]);
  });

  it("lists a subcommand's options", async () => {
    const help = parseHelp(await runCli(["swap", "quote", "--help"]));
    expect(help.path).toEqual(["swap", "quote"]);
    expect(sectionNames(help.text, "Options")).toEqual([
      "--from",
      "--to",
      "--from-account",
      "--to-account",
      "--amount",
      "--output",
    ]);
  });

  it("shows the group help for an unknown subcommand", async () => {
    const help = parseHelp(await runCli(["swap", "bogus"]));
    expect(help.path).toEqual(["swap"]);
  });
});

describe("wallet-cli unknown command", () => {
  it.each([[["nope"]], [["nope", "--help"]]])(
    "%j fails with the available commands",
    async args => {
      const res = await runCli(args);
      expect(res.exitCode).toBe(1);
      expect(JSON.parse(res.stderr).error).toMatchObject({
        kind: "command-not-found",
        message: "Command 'nope' not found",
        available: TOP_LEVEL_COMMANDS,
      });
    },
  );

  it("suggests the closest command", async () => {
    const res = await runCli(["sesion"]);
    expect(res.exitCode).toBe(1);
    expect(JSON.parse(res.stderr).error).toMatchObject({
      message: "Command 'sesion' not found. Did you mean 'session'?",
      suggestion: "session",
    });
  });
});

describe("wallet-cli --llms", () => {
  it("indexes every top-level command", async () => {
    const res = await runCli(["--llms"]);
    expect(res.exitCode).toBe(0);
    for (const name of TOP_LEVEL_COMMANDS) {
      expect(res.stdout).toContain(`| \`wallet-cli ${name}`);
    }
  });

  it("--llms-full documents every subcommand's options", async () => {
    const res = await runCli(["--llms-full"]);
    expect(res.exitCode).toBe(0);
    for (const name of ["account discover", "ring encrypt", "session view", "swap quote"]) {
      expect(res.stdout).toContain(`## wallet-cli ${name}\n`);
    }
  });
});
