/**
 * In-process MCP runner for tests.
 *
 * Mirrors [cli-runner.ts] but drives the wallet-cli MCP server ([../../mcp/server.ts]) instead
 * of the Bunli CLI. It connects an in-memory MCP `Client` to an in-process `McpServer` via the
 * SDK's `InMemoryTransport.createLinkedPair()`, with the exact same mocked DMK transport + HTTP
 * interception wiring the CLI runner uses (shared through [mock-env.ts]).
 *
 * Because a tool call runs the shared command core in-process, env vars (XDG_STATE_HOME session
 * dir, mock port, DMK mock) must be applied for the whole harness scope — `withMcpHarness`
 * applies them on entry and restores them on exit. Tests within a Bun file run sequentially, so
 * CLI and MCP harnesses can be multiplexed against different mock servers without racing.
 */

import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Progress } from "@modelcontextprotocol/sdk/types.js";
import {
  applyEnv,
  clearMockPort,
  installInterceptors,
  restoreEnv,
  setMockPort,
  setupDmkMock,
  type SetTestDmkTransportFn,
} from "./mock-env";

// ---------------------------------------------------------------------------
// Lazy loader — the MCP server module pulls in the full CLI/live-common graph,
// so defer the import to the first harness call (same rationale as cli-runner).
// ---------------------------------------------------------------------------

type BuildMcpServerFn = () => McpServer;

let _buildMcpServer: BuildMcpServerFn | null = null;
let _setTestDmkTransport: SetTestDmkTransportFn | null = null;
let _ClientCtor: typeof import("@modelcontextprotocol/sdk/client/index.js").Client | null = null;
let _InMemoryTransport:
  | typeof import("@modelcontextprotocol/sdk/inMemory.js").InMemoryTransport
  | null = null;

async function getModules(): Promise<{
  buildMcpServer: BuildMcpServerFn;
  setTestDmkTransport: SetTestDmkTransportFn;
  ClientCtor: typeof import("@modelcontextprotocol/sdk/client/index.js").Client;
  InMemoryTransport: typeof import("@modelcontextprotocol/sdk/inMemory.js").InMemoryTransport;
}> {
  if (!_buildMcpServer) {
    const [serverMod, dmkMod, clientMod, inMemoryMod] = await Promise.all([
      import("../../mcp/server"),
      import("../../device/register-dmk-transport"),
      import("@modelcontextprotocol/sdk/client/index.js"),
      import("@modelcontextprotocol/sdk/inMemory.js"),
    ]);
    _buildMcpServer = serverMod.buildMcpServer;
    _setTestDmkTransport = dmkMod._setTestDmkTransport as SetTestDmkTransportFn;
    _ClientCtor = clientMod.Client;
    _InMemoryTransport = inMemoryMod.InMemoryTransport;
  }
  return {
    buildMcpServer: _buildMcpServer!,
    setTestDmkTransport: _setTestDmkTransport!,
    ClientCtor: _ClientCtor!,
    InMemoryTransport: _InMemoryTransport!,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Normalized result of an MCP `tools/call`, plus any progress notifications received. */
export type McpCallResult = {
  isError: boolean;
  /** The tool's `structuredContent` (the makeEnvelope payload or structured error). */
  structuredContent: Record<string, unknown> | undefined;
  /** First text content block, if any. */
  text: string;
  /** `JSON.parse(text)` when the text is JSON, otherwise `undefined`. */
  data: Record<string, unknown> | undefined;
  /** Progress notifications received during the call, in order. */
  progress: Progress[];
};

export type McpHarness = {
  client: Client;
  /** List advertised tools (raw MCP `tools/list` result). */
  listTools: () => ReturnType<Client["listTools"]>;
  /** Call a tool by name, collecting the result envelope and any progress notifications. */
  callTool: (name: string, args?: Record<string, unknown>) => Promise<McpCallResult>;
};

type ToolCallRaw = {
  isError?: boolean;
  structuredContent?: Record<string, unknown>;
  content?: Array<{ type: string; text?: string }>;
};

function normalizeResult(raw: ToolCallRaw, progress: Progress[]): McpCallResult {
  const first = Array.isArray(raw.content) ? raw.content[0] : undefined;
  const text = first?.type === "text" && typeof first.text === "string" ? first.text : "";
  let data: Record<string, unknown> | undefined;
  if (text) {
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      data = undefined;
    }
  }
  return {
    isError: raw.isError === true,
    structuredContent: raw.structuredContent,
    text,
    data,
    progress,
  };
}

/**
 * Set up an in-memory MCP client+server (mocked DMK + HTTP interception + env), run `fn` with a
 * harness, then tear everything down. Env defaults mirror cli-runner (NO_COLOR / CLAUDECODE /
 * WALLET_CLI_NO_NUDGE) so behavior matches the CLI path byte-for-byte.
 */
export async function withMcpHarness<T>(
  env: Record<string, string>,
  fn: (harness: McpHarness) => Promise<T>,
): Promise<T> {
  const mergedEnv: Record<string, string> = {
    NO_COLOR: "1",
    CLAUDECODE: "1",
    WALLET_CLI_NO_NUDGE: "1",
    ...env,
  };

  const { buildMcpServer, setTestDmkTransport, ClientCtor, InMemoryTransport } = await getModules();

  if (mergedEnv.WALLET_CLI_MOCK_PORT) {
    await installInterceptors();
    setMockPort(Number(mergedEnv.WALLET_CLI_MOCK_PORT));
  }

  const dmkMockInstalled = await setupDmkMock(mergedEnv, setTestDmkTransport);
  const savedEnv = applyEnv(mergedEnv);

  const server = buildMcpServer();
  const client = new ClientCtor({ name: "wallet-cli-test-client", version: "0.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

  const harness: McpHarness = {
    client,
    listTools: () => client.listTools(),
    callTool: async (name, args = {}) => {
      const progress: Progress[] = [];
      const raw = (await client.callTool({ name, arguments: args }, undefined, {
        onprogress: p => progress.push(p),
      })) as ToolCallRaw;
      return normalizeResult(raw, progress);
    },
  };

  try {
    return await fn(harness);
  } finally {
    await client.close().catch(() => {});
    await server.close().catch(() => {});
    restoreEnv(savedEnv);
    if (dmkMockInstalled) setTestDmkTransport(null);
    if (mergedEnv.WALLET_CLI_MOCK_PORT) clearMockPort();
  }
}
