import { describe, it, expect } from "bun:test";
import pkg from "../package.json" with { type: "json" };
import { runCli, type RunResult } from "./testing/cli-runner";

// Help, version and command-lookup errors are printed by bunli straight to the process
// streams, so runCli's wallet-cli output capture misses them. bunli prints JSON only when
// stdout is not a TTY, so the run pins that mode whatever terminal the tests run in.
async function runCliCapturingBunli(args: string[]): Promise<RunResult> {
  const out: string[] = [];
  const err: string[] = [];
  const stdoutWrite = process.stdout.write;
  const stderrWrite = process.stderr.write;
  const stdoutIsTTY = Object.getOwnPropertyDescriptor(process.stdout, "isTTY");
  Object.defineProperty(process.stdout, "isTTY", { value: false, configurable: true });
  process.stdout.write = ((chunk: string | Uint8Array) => {
    out.push(String(chunk));
    return true;
  }) as typeof process.stdout.write;
  process.stderr.write = ((chunk: string | Uint8Array) => {
    err.push(String(chunk));
    return true;
  }) as typeof process.stderr.write;
  try {
    const res = await runCli(args);
    return {
      exitCode: res.exitCode,
      stdout: [res.stdout, ...out].join("").trim(),
      stderr: [res.stderr, ...err].join("").trim(),
    };
  } finally {
    process.stdout.write = stdoutWrite;
    process.stderr.write = stderrWrite;
    if (stdoutIsTTY) Object.defineProperty(process.stdout, "isTTY", stdoutIsTTY);
    else delete (process.stdout as { isTTY?: boolean }).isTTY;
  }
}

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
    const res = await runCliCapturingBunli([flag]);
    expect(res.exitCode).toBe(0);
    expect(JSON.parse(res.stdout)).toEqual({
      ok: true,
      data: { type: "version", name: "wallet-cli", version: pkg.version },
    });
  });
});

describe("wallet-cli --help", () => {
  it.each([[["--help"]], [["-h"]], [[]]])("%j lists every command in order", async args => {
    const help = parseHelp(await runCliCapturingBunli(args));
    expect(help.path).toEqual([]);
    expect(sectionNames(help.text, "Commands")).toEqual(TOP_LEVEL_COMMANDS);
    expect(help.text).toContain("session        Session management commands");
  });

  it.each([[["swap", "--help"]], [["--help", "swap"]], [["swap"]]])(
    "%j lists the group's subcommands",
    async args => {
      const help = parseHelp(await runCliCapturingBunli(args));
      expect(help.path).toEqual(["swap"]);
      expect(sectionNames(help.text, "Subcommands")).toEqual(["execute", "quote", "status"]);
    },
  );

  it("lists ring subcommands built by a factory", async () => {
    const help = parseHelp(await runCliCapturingBunli(["ring", "--help"]));
    expect(sectionNames(help.text, "Subcommands")).toEqual([
      "init",
      "encrypt",
      "decrypt",
      "keys",
      "destroy",
    ]);
  });

  it("lists a subcommand's options", async () => {
    const help = parseHelp(await runCliCapturingBunli(["swap", "quote", "--help"]));
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
    const help = parseHelp(await runCliCapturingBunli(["swap", "bogus"]));
    expect(help.path).toEqual(["swap"]);
  });
});

describe("wallet-cli unknown command", () => {
  it.each([[["nope"]], [["nope", "--help"]]])(
    "%j fails with the available commands",
    async args => {
      const res = await runCliCapturingBunli(args);
      expect(res.exitCode).toBe(1);
      expect(JSON.parse(res.stderr).error).toMatchObject({
        kind: "command-not-found",
        message: "Command 'nope' not found",
        available: TOP_LEVEL_COMMANDS,
      });
    },
  );

  it("suggests the closest command", async () => {
    const res = await runCliCapturingBunli(["sesion"]);
    expect(res.exitCode).toBe(1);
    expect(JSON.parse(res.stderr).error).toMatchObject({
      message: "Command 'sesion' not found. Did you mean 'session'?",
      suggestion: "session",
    });
  });
});

describe("wallet-cli --llms", () => {
  it("indexes every top-level command", async () => {
    const res = await runCliCapturingBunli(["--llms"]);
    expect(res.exitCode).toBe(0);
    for (const name of TOP_LEVEL_COMMANDS) {
      expect(res.stdout).toContain(`| \`wallet-cli ${name}`);
    }
  });

  it("--llms-full documents every subcommand's options", async () => {
    const res = await runCliCapturingBunli(["--llms-full"]);
    expect(res.exitCode).toBe(0);
    for (const name of ["account discover", "ring encrypt", "session view", "swap quote"]) {
      expect(res.stdout).toContain(`## wallet-cli ${name}\n`);
    }
  });
});
