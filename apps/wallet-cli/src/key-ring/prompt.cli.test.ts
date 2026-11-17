import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { _setTestControllingTtyPath } from "./prompt";
import { runCli } from "../testing/cli-runner";
import { pipedStdin, terminalTyping, withStdin, type FakeTerminal } from "../testing/fake-stdin";

const PASSWORD = "testpw";
const ENTER = "\r";
const BACKSPACE = "\x7f";
const CTRL_C = "\x03";

// A WALLET_PASS from the developer's shell would answer every prompt.
const shellPassword = process.env.WALLET_PASS;
let dir: string;
let env: Record<string, string>;
let plainFile: string;
let encFile: string;

// A password-protected ring, so every `ring encrypt` asks for the password.
beforeEach(async () => {
  delete process.env.WALLET_PASS;
  dir = mkdtempSync(join(tmpdir(), "wallet-cli-prompt-test-"));
  env = { XDG_STATE_HOME: dir, WALLET_CLI_MOCK: "1" };
  plainFile = join(dir, "plain.txt");
  encFile = join(dir, "plain.enc");
  writeFileSync(plainFile, "hello");
  const init = await runCli(["ring", "init", "--name", "prompt-member"], {
    ...env,
    WALLET_CLI_MOCK_DMK: "1",
    WALLET_PASS: PASSWORD,
  });
  expect(init.exitCode, `init failed: ${init.stderr}`).toBe(0);
});
afterEach(() => {
  if (shellPassword !== undefined) process.env.WALLET_PASS = shellPassword;
  _setTestControllingTtyPath(null);
  rmSync(dir, { recursive: true, force: true });
});

function encrypt(stdin: ReturnType<typeof pipedStdin> | FakeTerminal, ...args: string[]) {
  return withStdin(stdin, () =>
    runCli(
      ["ring", "encrypt", "--key", "prod", "--input", plainFile, "--out", encFile, ...args],
      env,
    ),
  );
}

async function encryptFailure(stdin: ReturnType<typeof pipedStdin> | FakeTerminal) {
  const { exitCode, stdout } = await encrypt(stdin, "--output", "json");
  return { exitCode, error: JSON.parse(stdout).error as { message: string } };
}

describe("ring password prompt (CLI)", () => {
  it("reads the password typed at the terminal without echoing it, then restores the terminal", async () => {
    const terminal = terminalTyping("test", "pw", ENTER);

    const { exitCode, stderr } = await encrypt(terminal);

    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    expect(stderr).toStartWith("Password: \nFetching key from your Ledger Key Ring…");
    expect(stderr).not.toContain(PASSWORD);
    expect(terminal.rawMode).toBe(false);
    expect(existsSync(encFile)).toBe(true);
  });

  it("submits a pasted password at its newline and applies backspaces", async () => {
    const { exitCode, stderr } = await encrypt(terminalTyping(`testpx${BACKSPACE}w\nignored`));

    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    expect(existsSync(encFile)).toBe(true);
  });

  it("rejects a mistyped password", async () => {
    const { exitCode, error } = await encryptFailure(terminalTyping(`wrong${ENTER}`));

    expect(exitCode).toBe(1);
    expect(error.message).toMatch(/[Ww]rong password/);
    expect(existsSync(encFile)).toBe(false);
  });

  it("cancels on Ctrl-C at the prompt", async () => {
    const { exitCode, error } = await encryptFailure(terminalTyping("te", CTRL_C));

    expect(exitCode).toBe(1);
    expect(error.message).toBe("Cancelled");
    expect(existsSync(encFile)).toBe(false);
  });

  it("explains how to pass WALLET_PASS when stdin is piped and there is no terminal", async () => {
    _setTestControllingTtyPath(join(dir, "no-tty"));

    const { exitCode, error } = await encryptFailure(pipedStdin("payload"));

    expect(exitCode).toBe(1);
    expect(error.message).toStartWith(
      "Password required but no TTY available and WALLET_PASS is not set.\n" +
        "Inject it from your OS keychain before running the command:\n" +
        "  macOS : WALLET_PASS=$(security find-generic-password",
    );
    expect(existsSync(encFile)).toBe(false);
  });
});
