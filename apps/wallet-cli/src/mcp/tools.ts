/**
 * MCP tool registry: maps snake_case tool names to the shared command core, its zod input
 * schema, the output-context builder, and whether the tool drives the Ledger (must acquire
 * the device lock). Both the CLI handlers and these tools call the exact same `core` fn, so
 * an MCP `tools/call` returns the same `makeEnvelope` payload as `--output json`.
 */

import { z } from "zod";
import type { CommandOutput, OutputContext } from "../output";
import {
  accountDiscoverContext,
  accountDiscoverCore,
  accountDiscoverInputSchema,
} from "../commands/account/discover";
import { balancesContext, balancesCore, balancesInputSchema } from "../commands/balances";
import { operationsContext, operationsCore, operationsInputSchema } from "../commands/operations";
import { receiveContext, receiveCore, receiveInputSchema } from "../commands/receive";
import { sendContext, sendCore, sendInputSchema } from "../commands/send";
import {
  genuineCheckContext,
  genuineCheckCore,
  genuineCheckInputSchema,
} from "../commands/genuine-check";
import {
  sessionViewContext,
  sessionViewCore,
  sessionViewInputSchema,
} from "../commands/session/view";
import {
  sessionResetContext,
  sessionResetCore,
  sessionResetInputSchema,
} from "../commands/session/reset";
import { swapQuoteContext, swapQuoteCore, swapQuoteInputSchema } from "../commands/swap/quote";
import { swapStatusContext, swapStatusCore, swapStatusInputSchema } from "../commands/swap/status";
import {
  swapExecuteContext,
  swapExecuteCore,
  swapExecuteInputSchema,
} from "../commands/swap/execute";
import {
  assetsTokenContext,
  assetsTokenCore,
  assetsTokenInputSchema,
} from "../commands/assets/token";
import {
  assetsTokenByIdContext,
  assetsTokenByIdCore,
  assetsTokenByIdInputSchema,
} from "../commands/assets/token-by-id";

/** Type-erased MCP tool specification stored in the registry. */
export type McpToolSpec = {
  name: string;
  description: string;
  /** Zod object schema advertised to clients and used to validate/parse tool arguments. */
  inputSchema: z.ZodObject<z.ZodRawShape>;
  /** Whether a given (validated) input requires the shared device lock. */
  deviceTouching: (input: unknown) => boolean;
  /** Build the JSON envelope context for the given (validated) input. */
  ctxFor: (input: unknown) => OutputContext;
  /** Run the shared command core with the provided (collecting) output. */
  core: (input: unknown, out: CommandOutput) => Promise<void>;
};

function tool<S extends z.ZodObject<z.ZodRawShape>>(spec: {
  name: string;
  description: string;
  inputSchema: S;
  ctxFor: (input: z.infer<S>) => OutputContext;
  core: (input: z.infer<S>, out: CommandOutput) => Promise<void>;
  deviceTouching?: (input: z.infer<S>) => boolean;
}): McpToolSpec {
  return {
    name: spec.name,
    description: spec.description,
    inputSchema: spec.inputSchema,
    deviceTouching: input =>
      spec.deviceTouching ? spec.deviceTouching(input as z.infer<S>) : false,
    ctxFor: input => spec.ctxFor(input as z.infer<S>),
    core: (input, out) => spec.core(input as z.infer<S>, out),
  };
}

export const MCP_TOOLS: readonly McpToolSpec[] = [
  tool({
    name: "account_discover",
    description:
      "Discover accounts for a network on the connected Ledger and save them to the session (requires the device).",
    inputSchema: accountDiscoverInputSchema,
    ctxFor: accountDiscoverContext,
    core: accountDiscoverCore,
    deviceTouching: () => true,
  }),
  tool({
    name: "session_view",
    description: "Display all accounts stored in the current session (no device required).",
    inputSchema: sessionViewInputSchema,
    ctxFor: sessionViewContext,
    core: sessionViewCore,
  }),
  tool({
    name: "session_reset",
    description: "Wipe all accounts from the current session (no device required).",
    inputSchema: sessionResetInputSchema,
    ctxFor: sessionResetContext,
    core: sessionResetCore,
  }),
  tool({
    name: "balances",
    description: "Fetch native and token balances for a session account (no device required).",
    inputSchema: balancesInputSchema,
    ctxFor: balancesContext,
    core: balancesCore,
  }),
  tool({
    name: "operations",
    description: "List operations for a session account (no device required).",
    inputSchema: operationsInputSchema,
    ctxFor: operationsContext,
    core: operationsCore,
  }),
  tool({
    name: "receive",
    description:
      "Get a receive address for a session account, optionally verifying it on the Ledger (verify requires the device).",
    inputSchema: receiveInputSchema,
    ctxFor: receiveContext,
    core: receiveCore,
    deviceTouching: input => input.verify === true,
  }),
  tool({
    name: "send",
    description:
      "Sign and broadcast a transaction (requires the device unless dry-run). Use dry-run to prepare without signing.",
    inputSchema: sendInputSchema,
    ctxFor: sendContext,
    core: sendCore,
    deviceTouching: input => input["dry-run"] !== true,
  }),
  tool({
    name: "swap_quote",
    description: "Fetch swap quotes (no device required).",
    inputSchema: swapQuoteInputSchema,
    ctxFor: swapQuoteContext,
    core: swapQuoteCore,
  }),
  tool({
    name: "swap_execute",
    description:
      "Run the full swap pipeline with the Ledger device (nonce -> payload -> complete exchange -> sign/broadcast).",
    inputSchema: swapExecuteInputSchema,
    ctxFor: swapExecuteContext,
    core: (input, out) => swapExecuteCore(input, out),
    deviceTouching: () => true,
  }),
  tool({
    name: "swap_status",
    description: "Read the current status of a swap from the partner API (no device required).",
    inputSchema: swapStatusInputSchema,
    ctxFor: swapStatusContext,
    core: swapStatusCore,
  }),
  tool({
    name: "genuine_check",
    description: "Check whether the connected Ledger device is genuine (requires the device).",
    inputSchema: genuineCheckInputSchema,
    ctxFor: genuineCheckContext,
    core: genuineCheckCore,
    deviceTouching: () => true,
  }),
  tool({
    name: "assets_token",
    description:
      "Resolve a token by contract address on a given network, e.g. ethereum 0xdac17f95... (no device required).",
    inputSchema: assetsTokenInputSchema,
    ctxFor: assetsTokenContext,
    core: assetsTokenCore,
  }),
  tool({
    name: "assets_token_by_id",
    description:
      "Resolve a token by its Ledger id, e.g. ethereum/erc20/usd_tether__erc20_ (no device required).",
    inputSchema: assetsTokenByIdInputSchema,
    ctxFor: assetsTokenByIdContext,
    core: assetsTokenByIdCore,
  }),
];
