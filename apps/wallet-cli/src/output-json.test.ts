import "./live-common-setup";
import { beforeEach, describe, expect, it } from "bun:test";
import { installOutputCapture } from "./shared/ui";
import { CliProcessExitError } from "./cli-process-exit-error";

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
      out.address("0xabc");
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

  it("secretsInit emits member and rootId in envelope", () => {
    try {
      const out = createCommandOutput("json", { command: "secrets init", network: "all" });
      out.secretsInit({ memberName: "my-machine (darwin)", rootId: "root-abc" });
    } finally {
      restore();
    }
    const [line] = writes.join("").trim().split("\n").map(l => JSON.parse(l));
    expect(line).toMatchObject({
      status: "success",
      command: "secrets init",
      network: "all",
      member: "my-machine (darwin)",
      rootId: "root-abc",
    });
  });

  it("secretsKeys emits keys array in envelope", () => {
    try {
      const out = createCommandOutput("json", { command: "secrets keys", network: "all" });
      out.secretsKeys([
        { domain: "prod", firstUsed: "2026-04-27T00:00:00.000Z" },
        { domain: "staging", firstUsed: "2026-04-28T00:00:00.000Z" },
      ]);
    } finally {
      restore();
    }
    const [line] = writes.join("").trim().split("\n").map(l => JSON.parse(l));
    expect(line).toMatchObject({
      status: "success",
      command: "secrets keys",
      keys: [
        { domain: "prod", firstUsed: "2026-04-27T00:00:00.000Z" },
        { domain: "staging", firstUsed: "2026-04-28T00:00:00.000Z" },
      ],
    });
  });

  it("secretsKeys emits empty keys array when no domains tracked", () => {
    try {
      const out = createCommandOutput("json", { command: "secrets keys", network: "all" });
      out.secretsKeys([]);
    } finally {
      restore();
    }
    const [line] = writes.join("").trim().split("\n").map(l => JSON.parse(l));
    expect(line).toMatchObject({ status: "success", keys: [] });
  });

  it("secretsDestroy emits destroyed=true when remote succeeded", () => {
    try {
      const out = createCommandOutput("json", { command: "secrets destroy", network: "all" });
      out.secretsDestroy(true);
    } finally {
      restore();
    }
    const [line] = writes.join("").trim().split("\n").map(l => JSON.parse(l));
    expect(line).toMatchObject({ status: "success", destroyed: true, local_wiped: true });
  });

  it("secretsDestroy emits destroyed=false when only local wipe", () => {
    try {
      const out = createCommandOutput("json", { command: "secrets destroy", network: "all" });
      out.secretsDestroy(false);
    } finally {
      restore();
    }
    const [line] = writes.join("").trim().split("\n").map(l => JSON.parse(l));
    expect(line).toMatchObject({ status: "success", destroyed: false, local_wiped: true });
  });

  it("secretsDestroyCancelled emits cancelled:true envelope", () => {
    try {
      const out = createCommandOutput("json", { command: "secrets destroy", network: "all" });
      out.secretsDestroyCancelled();
    } finally {
      restore();
    }
    const [line] = writes.join("").trim().split("\n").map(l => JSON.parse(l));
    expect(line).toMatchObject({ status: "success", cancelled: true });
  });

  it("secretsEncrypt emits output path and byte count", () => {
    try {
      const out = createCommandOutput("json", { command: "secrets encrypt", network: "all" });
      out.secretsEncrypt({ dest: "/tmp/out.enc", bytes: 64 });
    } finally {
      restore();
    }
    const [line] = writes.join("").trim().split("\n").map(l => JSON.parse(l));
    expect(line).toMatchObject({ status: "success", output: "/tmp/out.enc", bytes: 64 });
  });

  it("secretsDecrypt emits output path", () => {
    try {
      const out = createCommandOutput("json", { command: "secrets decrypt", network: "all" });
      out.secretsDecrypt({ dest: "/tmp/out.txt" });
    } finally {
      restore();
    }
    const [line] = writes.join("").trim().split("\n").map(l => JSON.parse(l));
    expect(line).toMatchObject({ status: "success", output: "/tmp/out.txt" });
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
