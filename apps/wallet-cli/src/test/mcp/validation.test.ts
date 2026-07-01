import { describe, it, expect } from "bun:test";
import { withMcpHarness } from "../helpers/mcp-runner";

// Argument validation must fail loudly (isError) rather than let a tool run with guessed inputs.
describe("mcp argument validation", () => {
  it("send without required `to`/`amount` returns an isError result, never runs the tool", async () => {
    const result = await withMcpHarness({}, ({ callTool }) =>
      callTool("send", { account: "ethereum-1" }),
    );

    expect(result.isError).toBe(true);
    // Whether the SDK pre-validates or our handler validates, the message names the offending
    // tool and does not contain a success envelope.
    expect(result.text).toContain("Invalid arguments for tool");
    expect(result.text.toLowerCase()).toContain("send");
    expect((result.structuredContent as Record<string, unknown> | undefined)?.status).not.toBe(
      "success",
    );
  });

  it("balances with a wrong-typed `account` (number) is rejected", async () => {
    const result = await withMcpHarness({}, ({ callTool }) =>
      // account must be a string; a number must not be coerced/guessed.
      callTool("balances", { account: 123 as unknown as string }),
    );

    expect(result.isError).toBe(true);
    expect(result.text).toContain("Invalid arguments for tool");
  });

  it("balances with no `account` (an effectively-required field) is rejected up front", async () => {
    const result = await withMcpHarness({}, ({ callTool }) =>
      // `account` is required in the schema, so a missing arg must fail argument validation
      // rather than fall through to a later runtime "Missing account" error.
      callTool("balances", {} as unknown as { account: string }),
    );

    expect(result.isError).toBe(true);
    expect(result.text).toContain("Invalid arguments for tool");
    expect((result.structuredContent as Record<string, unknown> | undefined)?.status).not.toBe(
      "success",
    );
  });

  it("swap_execute without `account` is rejected up front (no positional fallback over MCP)", async () => {
    const result = await withMcpHarness({}, ({ callTool }) =>
      // `account` is required in the schema; a missing source account must fail argument
      // validation rather than fall through to a later runtime "Missing account" error.
      callTool("swap_execute", {
        from: "ethereum",
        to: "bitcoin",
        provider: "changelly",
        amount: "0.001",
        "to-account": "bitcoin-1",
      } as unknown as { account: string }),
    );

    expect(result.isError).toBe(true);
    expect(result.text).toContain("Invalid arguments for tool");
    expect((result.structuredContent as Record<string, unknown> | undefined)?.status).not.toBe(
      "success",
    );
  });

  it("swap_execute without `to-account` is rejected up front", async () => {
    const result = await withMcpHarness({}, ({ callTool }) =>
      callTool("swap_execute", {
        from: "ethereum",
        to: "bitcoin",
        provider: "changelly",
        amount: "0.001",
        account: "ethereum-1",
      } as unknown as { "to-account": string }),
    );

    expect(result.isError).toBe(true);
    expect(result.text).toContain("Invalid arguments for tool");
    expect((result.structuredContent as Record<string, unknown> | undefined)?.status).not.toBe(
      "success",
    );
  });

  it("rejects an unknown/typo'd argument key instead of silently dropping it", async () => {
    const result = await withMcpHarness({}, ({ callTool }) =>
      // Valid `account` plus a typo'd `acount`: the strict tool schema must reject the unknown
      // key rather than drop it and let the tool run as if it weren't passed.
      callTool("balances", { account: "ethereum-1", acount: "ethereum-1" } as unknown as {
        account: string;
      }),
    );

    expect(result.isError).toBe(true);
    expect(result.text).toContain("Invalid arguments for tool");
    expect((result.structuredContent as Record<string, unknown> | undefined)?.status).not.toBe(
      "success",
    );
  });
});
