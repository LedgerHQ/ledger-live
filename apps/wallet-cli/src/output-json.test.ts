import "./live-common-setup";
import { beforeEach, describe, expect, it } from "bun:test";
import { installOutputCapture } from "./shared/ui";
import { CliProcessExitError, getCliProcessExitCode } from "./cli-process-exit-error";
import { WalletCliDeviceError } from "./device/wallet-cli-device-error";
import { WalletCliError } from "./shared/wallet-cli-error";
import { USDT_TOKEN_INFO } from "./test/helpers/cal-fixtures";

const { createCommandOutput } = await import("./output");

describe("JsonCommandOutput", () => {
  const providerError = {
    code: "PAIR_NOT_SUPPORTED",
    type: "float" as const,
    provider: "paraswap",
    message: "Pair not supported",
    parameter: { from: "ethereum", to: "bitcoin" },
  };

  let writes: string[] = [];
  let restoreCapture: (() => void) | null = null;

  beforeEach(() => {
    writes = [];
    restoreCapture = installOutputCapture({
      stdout: chunk => {
        writes.push(chunk);
      },
    });
  });

  // afterEach is not strictly needed since installOutputCapture is stacked, but keeps state clean
  // We restore after each test to avoid leaking capture across tests
  const restore = () => {
    restoreCapture?.();
    restoreCapture = null;
  };

  it("emits device-state events as NDJSON before the final envelope", () => {
    try {
      const out = createCommandOutput("json", {
        command: "receive",
        network: "ethereum:main",
        account: "js:2:ethereum:0x123",
      });

      out.deviceState({ code: "awaiting_approval", reason: "unlock" });
      out.address("0xabc", true);
    } finally {
      restore();
    }

    const lines = writes
      .join("")
      .trim()
      .split("\n")
      .map(line => JSON.parse(line));
    expect(lines).toHaveLength(2);
    expect(lines[0]).toEqual({
      type: "device-state",
      command: "receive",
      network: "ethereum:main",
      account: "js:2:ethereum:0x123",
      state: { code: "awaiting_approval", reason: "unlock" },
      message: "Ledger is locked. Enter your PIN on the device.",
    });
    expect(lines[1]).toMatchObject({
      status: "success",
      command: "receive",
      network: "ethereum:main",
      account: "js:2:ethereum:0x123",
      address: "0xabc",
      verified: true,
      source: "device",
    });
  });

  it("emits a pre-verify-address NDJSON event so agents can surface the address", () => {
    try {
      const out = createCommandOutput("json", {
        command: "receive",
        network: "ethereum:main",
        account: "js:2:ethereum:0x123",
      });

      out.preVerifyAddress("0xabc");
    } finally {
      restore();
    }

    const lines = writes
      .join("")
      .trim()
      .split("\n")
      .map(line => JSON.parse(line));
    expect(lines).toHaveLength(1);
    expect(lines[0]).toEqual({
      type: "pre-verify-address",
      command: "receive",
      network: "ethereum:main",
      account: "js:2:ethereum:0x123",
      address: "0xabc",
    });
  });

  it("emits a signature-requested device-state event during send before the final envelope", () => {
    try {
      const out = createCommandOutput("json", {
        command: "send",
        network: "ethereum:main",
        account: "js:2:ethereum:0x123",
      });

      out.sendEvent({ type: "prepared", recipient: "0xabc", amount: "0.1 ETH", fees: "0.001 ETH" });
      out.sendEvent({ type: "device-signature-requested" });
      out.sendEvent({ type: "broadcasted", txHash: "0xdeadbeef" });
      out.sendComplete();
    } finally {
      restore();
    }

    const lines = writes
      .join("")
      .trim()
      .split("\n")
      .map(line => JSON.parse(line));
    expect(lines).toHaveLength(2);
    expect(lines[0]).toEqual({
      type: "device-state",
      command: "send",
      network: "ethereum:main",
      account: "js:2:ethereum:0x123",
      state: { code: "awaiting_approval", reason: "sign" },
      message: "Review on device. Approve or reject.",
    });
    expect(lines[1]).toMatchObject({
      status: "success",
      command: "send",
      network: "ethereum:main",
      account: "js:2:ethereum:0x123",
      recipient: "0xabc",
      amount: "0.1 ETH",
      fee: "0.001 ETH",
      tx_hash: "0xdeadbeef",
    });
  });

  it("emits genuine check output as a success envelope", () => {
    try {
      const out = createCommandOutput("json", {
        command: "genuine-check",
        network: "device",
      });

      out.genuineCheck();
    } finally {
      restore();
    }

    const lines = writes
      .join("")
      .trim()
      .split("\n")
      .map(line => JSON.parse(line));
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      status: "success",
      command: "genuine-check",
      network: "device",
      genuine: true,
    });
    expect(lines[0].timestamp).toEqual(expect.any(String));
  });

  it("emits swap quote output as NDJSON with provider errors", () => {
    try {
      const out = createCommandOutput("json", {
        command: "swap quote",
        network: "ethereum",
      });

      out.swapQuotes({
        quotes: [
          {
            quoteId: "quote-1",
            from: "ethereum",
            to: "bitcoin",
            rate: 3000,
            providerFee: null,
            networkFee: "gas 21000 (ETH)",
            receiveAmount: 0.05,
            provider: "paraswap",
            amountFrom: "0.1",
          },
        ],
        partialErrors: [providerError],
      });
    } finally {
      restore();
    }

    const lines = writes
      .join("")
      .trim()
      .split("\n")
      .map(line => JSON.parse(line));
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      status: "success",
      command: "swap quote",
      network: "ethereum",
      provider_errors: [providerError],
    });
    expect(lines[0].quotes[0]).toMatchObject({ quoteId: "quote-1", provider: "paraswap" });
  });

  it("emits a token() envelope containing the resolved TokenInfo", () => {
    try {
      const out = createCommandOutput("json", {
        command: "assets token",
        network: "ethereum",
      });
      out.token(USDT_TOKEN_INFO);
    } finally {
      restore();
    }

    const lines = writes
      .join("")
      .trim()
      .split("\n")
      .map(line => JSON.parse(line));
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      status: "success",
      command: "assets token",
      network: "ethereum",
      token: USDT_TOKEN_INFO,
    });
  });

  it("emits swap quote unavailability as an NDJSON error envelope", () => {
    try {
      const out = createCommandOutput("json", {
        command: "swap quote",
        network: "ethereum",
      });

      expect(() => out.swapQuotesUnavailable("No quotes available", [providerError])).toThrow(
        CliProcessExitError,
      );
    } finally {
      restore();
    }

    const lines = writes
      .join("")
      .trim()
      .split("\n")
      .map(line => JSON.parse(line));
    expect(lines).toHaveLength(1);
    expect(lines[0]).toEqual({
      ok: false,
      error: {
        command: "swap quote",
        code: "swap_quotes_unavailable",
        message: "No quotes available",
        retryable: false,
        provider_errors: [providerError],
      },
    });
  });

  /** Run `fn` inside out.run, returning the parsed NDJSON lines and the captured exit code. */
  async function runToFailure(
    ctx: { command: string; network: string; account?: string },
    error: unknown,
  ): Promise<{ lines: Array<Record<string, unknown>>; exitCode: number | null }> {
    let exitCode: number | null = null;
    try {
      const out = createCommandOutput("json", ctx);
      await out.run(async () => {
        throw error;
      });
    } catch (e) {
      exitCode = getCliProcessExitCode(e);
    } finally {
      restore();
    }
    const lines = writes
      .join("")
      .trim()
      .split("\n")
      .map(line => JSON.parse(line));
    return { lines, exitCode };
  }

  it("envelopes unclassified errors with code 'unknown' and retryable:false", async () => {
    const { lines, exitCode } = await runToFailure(
      { command: "balances", network: "ethereum:main" },
      new Error("something went sideways"),
    );
    expect(exitCode).toBe(1);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toEqual({
      ok: false,
      error: {
        command: "balances",
        code: "unknown",
        message: "something went sideways",
        retryable: false,
      },
    });
  });

  it("envelopes wrong_app device errors with expected/found details", async () => {
    const { lines, exitCode } = await runToFailure(
      { command: "send", network: "ethereum:main" },
      new WalletCliDeviceError({ code: "wrong_app", expected: "Ethereum", found: "Bitcoin" }),
    );
    expect(exitCode).toBe(4);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toEqual({
      ok: false,
      error: {
        command: "send",
        code: "wrong_app",
        message: "Wrong app (found: Bitcoin). Open Ethereum.",
        retryable: false,
        details: { expected: "Ethereum", found: "Bitcoin" },
      },
    });
  });

  it("envelopes app_not_installed device errors with the app name as details", async () => {
    const { lines, exitCode } = await runToFailure(
      { command: "account discover", network: "ethereum:main" },
      new WalletCliDeviceError({ code: "app_not_installed", appName: "Ethereum" }),
    );
    expect(exitCode).toBe(5);
    expect(lines[0]).toMatchObject({
      ok: false,
      error: {
        code: "app_not_installed",
        retryable: false,
        details: { appName: "Ethereum" },
      },
    });
  });

  it("envelopes locked device errors as retryable and exits 7", async () => {
    const { lines, exitCode } = await runToFailure(
      { command: "send", network: "ethereum:main" },
      new WalletCliDeviceError({ code: "locked" }),
    );
    expect(exitCode).toBe(7);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toEqual({
      ok: false,
      error: {
        command: "send",
        code: "locked",
        message: "Ledger is locked. Unlock your device with your PIN and retry.",
        retryable: true,
      },
    });
  });

  it("envelopes device_ambiguous with machine-readable candidates and exits 64", async () => {
    const candidates = [
      { id: "usb-1", name: "Ledger Nano S Plus", model: "nanoSP", transport: "usb" },
      { id: "17cb-aaa", name: "Solmaria", model: "flex", transport: "ble" },
    ];
    const { lines, exitCode } = await runToFailure(
      { command: "receive", network: "ethereum:main" },
      new WalletCliError("device_ambiguous", "Multiple Ledger devices found.", {
        hint: "Pass --device <id|name> to choose one (or set WALLET_CLI_DEVICE).",
        details: { candidates },
      }),
    );
    expect(exitCode).toBe(64);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toEqual({
      ok: false,
      error: {
        command: "receive",
        code: "device_ambiguous",
        message: "Multiple Ledger devices found.",
        retryable: false,
        hint: "Pass --device <id|name> to choose one (or set WALLET_CLI_DEVICE).",
        details: { candidates },
      },
    });
  });

  it("envelopes device_not_found as retryable with exit 3 (same as disconnected)", async () => {
    const { lines, exitCode } = await runToFailure(
      { command: "send", network: "ethereum:main" },
      new WalletCliError("device_not_found", "No Ledger device found.", {
        hint: "Unlock the device (and enable Bluetooth on Flex/Stax), then try again.",
      }),
    );
    expect(exitCode).toBe(3);
    expect(lines[0]).toEqual({
      ok: false,
      error: {
        command: "send",
        code: "device_not_found",
        message: "No Ledger device found.",
        retryable: true,
        hint: "Unlock the device (and enable Bluetooth on Flex/Stax), then try again.",
      },
    });
  });

  it("envelopes account_not_found with its hint and exits 1", async () => {
    const { lines, exitCode } = await runToFailure(
      { command: "balances", network: "ethereum:main" },
      new WalletCliError("account_not_found", 'No account labeled "ethereum-9" in session.', {
        hint: "Run `account discover` first to populate the session.",
        details: { label: "ethereum-9" },
      }),
    );
    expect(exitCode).toBe(1);
    expect(lines[0]).toEqual({
      ok: false,
      error: {
        command: "balances",
        code: "account_not_found",
        message: 'No account labeled "ethereum-9" in session.',
        retryable: false,
        hint: "Run `account discover` first to populate the session.",
        details: { label: "ethereum-9" },
      },
    });
  });

  it("envelopes session_corrupt with the file path as details", async () => {
    const { lines, exitCode } = await runToFailure(
      { command: "session view", network: "all" },
      new WalletCliError("session_corrupt", "Invalid session file at /tmp/session.yaml.", {
        hint: "Run `wallet-cli session reset` to clear it.",
        details: { path: "/tmp/session.yaml" },
      }),
    );
    expect(exitCode).toBe(1);
    expect(lines[0]).toMatchObject({
      ok: false,
      error: {
        code: "session_corrupt",
        retryable: false,
        hint: "Run `wallet-cli session reset` to clear it.",
        details: { path: "/tmp/session.yaml" },
      },
    });
  });

  it("unwraps a WalletCliError that a device boundary wrapped as an unknown device error", async () => {
    const inner = new WalletCliError("device_not_found", "No Ledger device found.", {
      hint: "Unlock the device (and enable Bluetooth on Flex/Stax), then try again.",
    });
    const wrapped = WalletCliDeviceError.fromUnknown(inner);
    const { lines, exitCode } = await runToFailure(
      { command: "account discover", network: "ethereum:main" },
      wrapped,
    );
    expect(exitCode).toBe(3);
    expect(lines[0]).toMatchObject({
      ok: false,
      error: {
        code: "device_not_found",
        message: "No Ledger device found.",
        retryable: true,
      },
    });
  });
});
