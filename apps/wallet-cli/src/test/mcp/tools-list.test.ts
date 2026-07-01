import { describe, it, expect } from "bun:test";
import { withMcpHarness } from "../helpers/mcp-runner";

// The full set of tools the MCP server must advertise. Mirrors MCP_TOOLS in src/mcp/tools.ts
// and the EXPECTED_TOOLS list the post-build smoke test asserts against.
const EXPECTED_TOOLS = [
  "account_discover",
  "session_view",
  "session_reset",
  "balances",
  "operations",
  "receive",
  "send",
  "swap_quote",
  "swap_execute",
  "swap_status",
  "genuine_check",
  "assets_token",
  "assets_token_by_id",
] as const;

describe("mcp tools/list", () => {
  it("advertises exactly the 13 wallet-cli tools", async () => {
    await withMcpHarness({}, async ({ listTools }) => {
      const { tools } = await listTools();
      const names = tools.map(t => t.name).sort();
      expect(names).toEqual([...EXPECTED_TOOLS].sort());
    });
  });

  it("every tool has a description and an object input schema", async () => {
    await withMcpHarness({}, async ({ listTools }) => {
      const { tools } = await listTools();
      for (const tool of tools) {
        expect(typeof tool.description).toBe("string");
        expect(tool.description!.length).toBeGreaterThan(0);
        expect(tool.inputSchema.type).toBe("object");
      }
    });
  });

  it("exposes the expected argument names on representative tools", async () => {
    await withMcpHarness({}, async ({ listTools }) => {
      const { tools } = await listTools();
      const byName = new Map(tools.map(t => [t.name, t]));

      // send: `account`, `to` and `amount` are required string args, `dry-run` is an optional flag.
      const send = byName.get("send")!;
      const sendProps = Object.keys(send.inputSchema.properties ?? {});
      expect(sendProps).toContain("to");
      expect(sendProps).toContain("amount");
      expect(sendProps).toContain("dry-run");
      expect(send.inputSchema.required ?? []).toEqual(
        expect.arrayContaining(["account", "to", "amount"]),
      );

      // receive: exposes account + verify (device gate); account is required, verify optional.
      const receive = byName.get("receive")!;
      const receiveProps = Object.keys(receive.inputSchema.properties ?? {});
      expect(receiveProps).toContain("account");
      expect(receiveProps).toContain("verify");
      expect(receive.inputSchema.required ?? []).toContain("account");
      expect(receive.inputSchema.required ?? []).not.toContain("verify");

      // assets_token_by_id: id is required.
      const tokenById = byName.get("assets_token_by_id")!;
      const tokenProps = Object.keys(tokenById.inputSchema.properties ?? {});
      expect(tokenProps).toContain("id");
      expect(tokenById.inputSchema.required ?? []).toContain("id");
    });
  });

  it("advertises the effectively-required fields as required, not optional", async () => {
    await withMcpHarness({}, async ({ listTools }) => {
      const { tools } = await listTools();
      const required = (name: string): string[] => {
        const tool = tools.find(t => t.name === name)!;
        return (tool.inputSchema.required as string[] | undefined) ?? [];
      };
      // Fields the core hard-requires must be advertised as required so `tools/list` is
      // accurate and a missing arg fails as invalid_arguments (not a later runtime error).
      expect(required("balances")).toContain("account");
      expect(required("operations")).toContain("account");
      expect(required("account_discover")).toContain("network");
      expect(required("assets_token")).toEqual(expect.arrayContaining(["network", "address"]));
      // swap_execute has no positional fallback over MCP and the core throws when either the
      // source or destination account is missing, so both must be advertised as required.
      expect(required("swap_execute")).toEqual(
        expect.arrayContaining(["account", "to-account", "from", "to", "provider", "amount"]),
      );
    });
  });
});
