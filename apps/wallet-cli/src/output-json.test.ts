import "./live-common-setup";
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
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

  afterEach(() => {
    restoreCapture?.();
    restoreCapture = null;
  });

  function parseLines(): unknown[] {
    return writes
      .join("")
      .trim()
      .split("\n")
      .map(line => JSON.parse(line));
  }

  it("emits device-state events as NDJSON before the final envelope", () => {
    const out = createCommandOutput("json", {
      command: "receive",
      network: "ethereum:main",
      account: "js:2:ethereum:0x123",
    });

    out.deviceState({ code: "awaiting_approval", reason: "unlock" });
    out.address("0xabc", true);

    const lines = parseLines();
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
    const out = createCommandOutput("json", {
      command: "receive",
      network: "ethereum:main",
      account: "js:2:ethereum:0x123",
    });

    out.preVerifyAddress("0xabc");

    const lines = parseLines();
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
    const out = createCommandOutput("json", {
      command: "send",
      network: "ethereum:main",
      account: "js:2:ethereum:0x123",
    });

    out.sendEvent({ type: "prepared", recipient: "0xabc", amount: "0.1 ETH", fees: "0.001 ETH" });
    out.sendEvent({ type: "device-signature-requested" });
    out.sendEvent({ type: "broadcasted", txHash: "0xdeadbeef" });
    out.sendComplete();

    const lines = parseLines();
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
    const out = createCommandOutput("json", {
      command: "genuine-check",
      network: "device",
    });

    out.genuineCheck();

    const lines = parseLines();
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      status: "success",
      command: "genuine-check",
      network: "device",
      genuine: true,
    });
    expect((lines[0] as Record<string, unknown>).timestamp).toEqual(expect.any(String));
  });

  it("emits swap quote output as NDJSON with provider errors", () => {
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

    const lines = parseLines();
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      status: "success",
      command: "swap quote",
      network: "ethereum",
      provider_errors: [providerError],
    });
    expect((lines[0] as Record<string, unknown[]>).quotes[0]).toMatchObject({
      quoteId: "quote-1",
      provider: "paraswap",
    });
  });

  it("emits a token() envelope containing the resolved TokenInfo", () => {
    const out = createCommandOutput("json", {
      command: "assets token",
      network: "ethereum",
    });
    out.token(USDT_TOKEN_INFO);

    const lines = parseLines();
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      status: "success",
      command: "assets token",
      network: "ethereum",
      token: USDT_TOKEN_INFO,
    });
  });

  it("ringInit emits member and snake_case root_id in envelope", () => {
    const out = createCommandOutput("json", { command: "ring init", network: "all" });
    out.ringInit({ memberName: "my-machine (darwin)", rootId: "root-abc" });

    const [line] = parseLines();
    expect(line).toMatchObject({
      status: "success",
      command: "ring init",
      network: "all",
      member: "my-machine (darwin)",
      root_id: "root-abc",
    });
  });

  it("ringKeys emits keys array in envelope", () => {
    const out = createCommandOutput("json", { command: "ring keys", network: "all" });
    out.ringKeys([
      { domain: "prod", firstUsed: "2026-04-27T00:00:00.000Z" },
      { domain: "staging", firstUsed: "2026-04-28T00:00:00.000Z" },
    ]);

    const [line] = parseLines();
    expect(line).toMatchObject({
      status: "success",
      command: "ring keys",
      keys: [
        { domain: "prod", first_used: "2026-04-27T00:00:00.000Z" },
        { domain: "staging", first_used: "2026-04-28T00:00:00.000Z" },
      ],
    });
  });

  it("ringKeys emits empty keys array when no keys tracked", () => {
    const out = createCommandOutput("json", { command: "ring keys", network: "all" });
    out.ringKeys([]);

    const [line] = parseLines();
    expect(line).toMatchObject({ status: "success", keys: [] });
  });

  it("ringDestroy emits destroyed=true when trustchain was destroyed", () => {
    const out = createCommandOutput("json", { command: "ring destroy", network: "all" });
    out.ringDestroy({ remoteSucceeded: true, trustchainDestroyed: true, localWiped: true });

    const [line] = parseLines();
    expect(line).toMatchObject({
      status: "success",
      destroyed: true,
      remote_succeeded: true,
      local_wiped: true,
    });
  });

  it("ringDestroy emits destroyed=false and remote_succeeded=true when only app was deactivated", () => {
    const out = createCommandOutput("json", { command: "ring destroy", network: "all" });
    out.ringDestroy({ remoteSucceeded: true, trustchainDestroyed: false, localWiped: true });

    const [line] = parseLines();
    expect(line).toMatchObject({
      status: "success",
      destroyed: false,
      remote_succeeded: true,
      local_wiped: true,
    });
  });

  it("ringDestroy emits member_ejected=true when the member was ejected from the ring", () => {
    const out = createCommandOutput("json", { command: "ring destroy", network: "all" });
    out.ringDestroy({
      remoteSucceeded: true,
      trustchainDestroyed: false,
      localWiped: true,
      memberEjected: true,
    });

    const [line] = parseLines();
    expect(line).toMatchObject({
      status: "success",
      destroyed: false,
      remote_succeeded: true,
      member_ejected: true,
      local_wiped: true,
    });
  });

  it("ringDestroy reports member_ejected=false when the remote teardown did not succeed", () => {
    const out = createCommandOutput("json", { command: "ring destroy", network: "all" });
    // member_ejected is only meaningful alongside remote_succeeded, so a failed teardown must not
    // report it even if a caller mis-populates memberEjected.
    out.ringDestroy({
      remoteSucceeded: false,
      trustchainDestroyed: false,
      localWiped: true,
      memberEjected: true,
    });

    const [line] = parseLines();
    expect(line).toMatchObject({ remote_succeeded: false, member_ejected: false });
  });

  it("ringDestroy emits destroyed=false and remote_succeeded=false when only local wipe", () => {
    const out = createCommandOutput("json", { command: "ring destroy", network: "all" });
    out.ringDestroy({ remoteSucceeded: false, trustchainDestroyed: false, localWiped: true });

    const [line] = parseLines();
    expect(line).toMatchObject({
      status: "success",
      destroyed: false,
      remote_succeeded: false,
      local_wiped: true,
    });
  });

  it("ringDestroy emits local_wiped=false when the keychain delete failed", () => {
    const out = createCommandOutput("json", { command: "ring destroy", network: "all" });
    out.ringDestroy({ remoteSucceeded: false, trustchainDestroyed: false, localWiped: false });

    const [line] = parseLines();
    expect(line).toMatchObject({
      status: "success",
      destroyed: false,
      remote_succeeded: false,
      local_wiped: false,
    });
  });

  it("ringDestroyCancelled emits cancelled:true envelope", () => {
    const out = createCommandOutput("json", { command: "ring destroy", network: "all" });
    out.ringDestroyCancelled();

    const [line] = parseLines();
    expect(line).toMatchObject({
      status: "success",
      command: "ring destroy",
      network: "all",
      cancelled: true,
    });
  });

  it("ringEncrypt emits output path and byte count", () => {
    const out = createCommandOutput("json", { command: "ring encrypt", network: "all" });
    out.ringEncrypt({ dest: "/tmp/out.enc", bytes: 64 });

    const [line] = parseLines();
    expect(line).toMatchObject({ status: "success", output: "/tmp/out.enc", bytes: 64 });
  });

  it("ringDecrypt emits output path", () => {
    const out = createCommandOutput("json", { command: "ring decrypt", network: "all" });
    out.ringDecrypt({ dest: "/tmp/out.txt" });

    const [line] = parseLines();
    expect(line).toMatchObject({ status: "success", output: "/tmp/out.txt" });
  });

  it("emits swapExecuteFullResult with both display-unit and atomic amounts plus the rate", () => {
    const out = createCommandOutput("json", {
      command: "swap execute",
      network: "ethereum",
    });

    out.swapExecuteFullResult({
      from: "ethereum",
      to: "bitcoin",
      provider: "changelly",
      amount: "0.1 ETH",
      transactionId: "tx-123",
      payload: {
        swapId: "swap-abc",
        payinAddress: "0x000000000000000000000000000000000000dead",
      } as unknown as Parameters<typeof out.swapExecuteFullResult>[0]["payload"],
      operationHash: "0xopHash",
      swapId: "swap-abc",
      amountExpectedTo: "0.0025",
      amountExpectedToAtomic: "250000",
      magnitudeAwareRate: "2500000",
    });

    const lines = parseLines();
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      status: "success",
      command: "swap execute",
      network: "ethereum",
      from: "ethereum",
      to: "bitcoin",
      provider: "changelly",
      transactionId: "tx-123",
      operationHash: "0xopHash",
      swapId: "swap-abc",
      // The normalization fix: both the human-readable and the raw atomic amount are exposed,
      // alongside the magnitude-aware rate.
      amountExpectedTo: "0.0025",
      amountExpectedToAtomic: "250000",
      magnitudeAwareRate: "2500000",
    });
  });

  it("emits swap quote unavailability as an NDJSON error envelope", () => {
    const out = createCommandOutput("json", {
      command: "swap quote",
      network: "ethereum",
    });

    expect(() => out.swapQuotesUnavailable("No quotes available", [providerError])).toThrow(
      CliProcessExitError,
    );

    const lines = parseLines();
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
