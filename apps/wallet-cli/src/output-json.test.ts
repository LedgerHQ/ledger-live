import "./live-common-setup";
import { beforeEach, describe, expect, it } from "bun:test";
import { installOutputCapture } from "./shared/ui";
import { CliProcessExitError } from "./cli-process-exit-error";
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
        provider_errors: [providerError],
      },
    });
  });
});
