/**
 * Builds the wallet-cli MCP server: one MCP tool per shared command core. Each tool call
 * validates its arguments with the command's zod schema, acquires the device lock for
 * device-touching tools, runs the core with a collecting output (so the returned envelope is
 * byte-for-byte identical to `--output json`), maps intermediate device-state / pre-verify
 * events to MCP progress notifications, and preserves the WalletCliDeviceError taxonomy in the
 * error result.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type {
  CallToolResult,
  ServerNotification,
  ServerRequest,
} from "@modelcontextprotocol/sdk/types.js";
import type { z } from "zod";
import { CliProcessExitError } from "../cli-process-exit-error";
import { WalletCliDeviceError } from "../device/wallet-cli-device-error";
import { renderDeviceState } from "../device/device-state";
import { createCollectingOutput, type CollectingError } from "../output";
import { HumanFormatter } from "../wallet/formatter/human";
import { CLI_VERSION } from "../skills/registry";
import { deviceLock } from "./device-lock";
import { MCP_TOOLS, type McpToolSpec } from "./tools";

type ToolExtra = RequestHandlerExtra<ServerRequest, ServerNotification>;

const MCP_SERVER_NAME = "ledger-wallet-cli";

function structuredErrorFromUnknown(e: unknown): CollectingError {
  if (e instanceof WalletCliDeviceError) {
    const { message } = renderDeviceState(e.state);
    return { code: e.state.code, message, exitCode: e.exitCode };
  }
  return { message: HumanFormatter.formatError(e), exitCode: 1 };
}

function successResult(envelope: Record<string, unknown>): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(envelope) }],
    structuredContent: envelope,
  };
}

function errorResult(error: CollectingError): CallToolResult {
  const payload: Record<string, unknown> = { message: error.message, exitCode: error.exitCode };
  if (error.code !== undefined) payload.code = error.code;
  if (error.provider_errors?.length) payload.provider_errors = error.provider_errors;
  return {
    isError: true,
    content: [{ type: "text", text: JSON.stringify(payload) }],
    structuredContent: payload,
  };
}

function validationErrorResult(name: string, error: z.ZodError): CallToolResult {
  const detail = error.issues
    .map(issue => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("; ");
  const message = `Invalid arguments for tool "${name}": ${detail}`;
  return errorResult({ code: "invalid_arguments", message, exitCode: 1 });
}

function progressMessage(event: Record<string, unknown>): string {
  if (event.type === "pre-verify-address") {
    const address = typeof event.address === "string" ? event.address : "";
    return `Verify this address on your Ledger: ${address}`;
  }
  if (typeof event.message === "string") return event.message;
  return "Device update";
}

async function handleToolCall(
  spec: McpToolSpec,
  rawArgs: unknown,
  extra: ToolExtra,
): Promise<CallToolResult> {
  // `.strict()` so unknown keys (e.g. a typo'd argument name) reject rather than being silently
  // dropped. The registered tool schema is also strict (see buildMcpServer), so the SDK already
  // rejects these before we get here; this is defense-in-depth for any direct handler call.
  const parsed = spec.inputSchema.strict().safeParse(rawArgs ?? {});
  if (!parsed.success) {
    return validationErrorResult(spec.name, parsed.error);
  }
  const input = parsed.data;

  const progressToken = extra._meta?.progressToken;
  let progress = 0;
  const { output, getResult } = createCollectingOutput(spec.ctxFor(input), {
    onEvent: event => {
      if (progressToken === undefined) return;
      progress += 1;
      void extra
        .sendNotification({
          method: "notifications/progress",
          params: { progressToken, progress, message: progressMessage(event) },
        })
        .catch(() => {
          // Progress notifications are best-effort; never fail the tool call over one.
        });
    },
  });

  const release = spec.deviceTouching(input) ? await deviceLock.acquire() : undefined;
  try {
    await spec.core(input, output);
  } catch (e) {
    // CliProcessExitError is the collecting sink's internal abort sentinel (error already
    // captured). Anything else was thrown before out.run (e.g. currency validation) — map it.
    if (!(e instanceof CliProcessExitError)) {
      return errorResult(structuredErrorFromUnknown(e));
    }
  } finally {
    release?.();
  }

  const { result, error } = getResult();
  if (error) return errorResult(error);
  if (result) return successResult(result);
  return errorResult({ message: "Command produced no result.", exitCode: 1 });
}

export function buildMcpServer(): McpServer {
  const server = new McpServer(
    { name: MCP_SERVER_NAME, version: CLI_VERSION },
    { capabilities: { tools: {} } },
  );

  for (const spec of MCP_TOOLS) {
    // Register the strict object schema (not just `.shape`) so the SDK's own argument validation
    // rejects unknown/typo'd keys (e.g. `acount`) as invalid_arguments instead of silently
    // dropping them and letting the tool run with a missing field.
    server.registerTool(
      spec.name,
      { description: spec.description, inputSchema: spec.inputSchema.strict() },
      (args, extra) => handleToolCall(spec, args, extra),
    );
  }

  return server;
}
