import "./live-common-setup";
import { afterEach, describe, expect, it } from "bun:test";
import { assertKnownFlags, resolveCommandPath } from "./shared/strict-flags";
import { USAGE_EXIT_CODE, WalletCliError } from "./shared/wallet-cli-error";
import { runCli } from "./test/helpers/cli-runner";
import { ETH_DESCRIPTOR } from "./test/helpers/constants";
import { makeSessionDir } from "./test/helpers/session-fixture";

/** Run assertKnownFlags expecting a rejection; fails the test when argv passes. */
function expectRejected(argv: string[]): WalletCliError {
  try {
    assertKnownFlags(argv);
  } catch (e) {
    expect(e).toBeInstanceOf(WalletCliError);
    return e as WalletCliError;
  }
  throw new Error(`expected \`${argv.join(" ")}\` to be rejected`);
}

describe("assertKnownFlags", () => {
  it("rejects an unknown flag with code unknown_flag, exit 64, and a did-you-mean hint", () => {
    const err = expectRejected(["send", "--dryrun"]);
    expect(err.code).toBe("unknown_flag");
    expect(err.exitCode).toBe(USAGE_EXIT_CODE);
    expect(err.retryable).toBe(false);
    expect(err.message).toBe('Unknown flag "--dryrun" for `send`.');
    expect(err.hint).toBe("Did you mean --dry-run?");
    expect(err.details).toEqual({ flag: "--dryrun", command: "send" });
  });

  it("points at --help when no known flag is close enough to suggest", () => {
    const err = expectRejected(["send", "--frobnicate"]);
    expect(err.code).toBe("unknown_flag");
    expect(err.hint).toBe("Run `wallet-cli send --help` to list supported flags.");
  });

  it("rejects unknown flags on subcommands with the full command path", () => {
    const err = expectRejected(["account", "discover", "--newtork", "ethereum"]);
    expect(err.hint).toBe("Did you mean --network?");
    expect(err.details).toEqual({ flag: "--newtork", command: "account discover" });
  });

  it("rejects unknown short flags", () => {
    const err = expectRejected(["balances", "-z"]);
    expect(err.code).toBe("unknown_flag");
    expect(err.details).toEqual({ flag: "-z", command: "balances" });
  });

  it("accepts valid invocations untouched", () => {
    assertKnownFlags(["send", "--account", "ethereum-1", "--to", "0xabc", "--amount", "0.01 ETH"]);
    assertKnownFlags(["balances", "ethereum-1", "--output", "json"]);
    assertKnownFlags(["account", "discover", "--network", "ethereum", "--device-timeout", "5000"]);
    assertKnownFlags(["session", "view"]);
    assertKnownFlags([]);
  });

  it("accepts --flag=value syntax", () => {
    assertKnownFlags(["send", "--account=ethereum-1", "--to=0xabc", "--amount=0.01 ETH"]);
    assertKnownFlags(["receive", "--verify=false", "--output=json"]);
  });

  it("accepts --no-<flag> negation for known flags only", () => {
    assertKnownFlags(["receive", "--no-verify", "--account", "ethereum-1"]);
    assertKnownFlags(["send", "--no-rbf", "--account", "ethereum-1"]);
    const err = expectRejected(["receive", "--no-frobnicate"]);
    expect(err.details).toEqual({ flag: "--no-frobnicate", command: "receive" });
  });

  it("accepts short aliases and bunli's global flags", () => {
    assertKnownFlags(["send", "-a", "ethereum-1", "-t", "0xabc", "--amount", "0.01 ETH"]);
    assertKnownFlags(["operations", "-l", "5"]);
    assertKnownFlags(["send", "-h"]);
    assertKnownFlags(["send", "--help"]);
    assertKnownFlags(["--version"]);
  });

  it("respects the -- separator: everything after it is passthrough", () => {
    assertKnownFlags(["balances", "--output", "json", "--", "--dryrun"]);
    const err = expectRejected(["send", "--dryrun", "--", "--ok"]);
    expect(err.details).toEqual({ flag: "--dryrun", command: "send" });
  });

  it("leaves unknown commands and unknown subcommands to bunli", () => {
    assertKnownFlags(["frobnicate", "--bogus"]);
    assertKnownFlags(["swap", "frobnicate", "--bogus"]);
  });

  it("resolves command paths the way bunli does", () => {
    expect(resolveCommandPath(["send", "--dryrun"])).toBe("send");
    expect(resolveCommandPath(["account", "discover", "ethereum"])).toBe("account discover");
    expect(resolveCommandPath(["frobnicate"])).toBeNull();
    expect(resolveCommandPath(["--version"])).toBeNull();
  });
});

describe("strict flags through runMain", () => {
  let sessionCleanup: (() => void) | undefined;
  afterEach(() => {
    sessionCleanup?.();
    sessionCleanup = undefined;
  });

  /** Empty session fixture: a regression past the strict check dies on account
   *  resolution instead of ever reaching a device. */
  function emptySessionEnv(): { XDG_STATE_HOME: string } {
    const fixture = makeSessionDir([]);
    sessionCleanup = fixture.cleanup;
    return fixture.env;
  }

  it("json mode: emits the canonical error envelope on stdout and exits 64", async () => {
    const { stdout, stderr, exitCode } = await runCli(
      ["send", "--dryrun", "--output", "json"],
      emptySessionEnv(),
    );
    expect(exitCode).toBe(64);
    expect(stderr).toBe("");
    expect(JSON.parse(stdout)).toEqual({
      ok: false,
      error: {
        command: "send",
        code: "unknown_flag",
        message: 'Unknown flag "--dryrun" for `send`.',
        retryable: false,
        hint: "Did you mean --dry-run?",
        details: { flag: "--dryrun", command: "send" },
      },
    });
  });

  it("json mode: also honors the --output=json form", async () => {
    const { stdout, exitCode } = await runCli(
      ["send", "--dryrun", "--output=json"],
      emptySessionEnv(),
    );
    expect(exitCode).toBe(64);
    const parsed = JSON.parse(stdout);
    expect(parsed.ok).toBe(false);
    expect(parsed.error.code).toBe("unknown_flag");
  });

  it("human mode: prints the message and suggestion on stderr and exits 64", async () => {
    const { stdout, stderr, exitCode } = await runCli(["send", "--dryrun"], emptySessionEnv());
    expect(exitCode).toBe(64);
    expect(stdout).toBe("");
    expect(stderr).toContain('Unknown flag "--dryrun" for `send`.');
    expect(stderr).toContain("Did you mean --dry-run?");
  });

  it("valid invocations pass through to the command untouched", async () => {
    const fixture = makeSessionDir([{ label: "ethereum-1", descriptor: ETH_DESCRIPTOR }]);
    sessionCleanup = fixture.cleanup;
    const { stdout, stderr, exitCode } = await runCli(
      ["session", "view", "--output", "json"],
      fixture.env,
    );
    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    expect(JSON.parse(stdout)).toMatchObject({
      status: "success",
      command: "session view",
      accounts: [{ label: "ethereum-1", descriptor: ETH_DESCRIPTOR }],
    });
  });

  it("unknown commands stay with bunli's command-not-found (no double report)", async () => {
    const { stdout, exitCode } = await runCli(["frobnicate", "--bogus"], emptySessionEnv());
    expect(exitCode).toBe(1);
    expect(stdout).toBe("");
  });
});
