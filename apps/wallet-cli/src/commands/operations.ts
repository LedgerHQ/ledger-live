import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { WalletAdapter } from "../wallet";
import { toV1, serializeV1, networkStringFromCurrencyId } from "../shared/accountDescriptor";
import { walletCliDebug } from "../shared/log";
import { type CommandOutput, type OutputContext, createCommandOutput } from "../output";
import {
  accountOption,
  outputOption,
  resolveAccountArg,
  resolveAccountDescriptor,
  resolveOutputFormat,
} from "./inputs";
import { trackOperationViewed } from "./accounts-analytics";

export const operationsInputSchema = z.object({
  account: z.string().min(1, "Account session label is required"),
  limit: z.coerce.number().int().min(1).optional(),
  cursor: z.string().min(1).optional(),
});

export type OperationsInput = z.infer<typeof operationsInputSchema>;

export function operationsContext(_input: OperationsInput): OutputContext {
  return { command: "operations", network: "", account: "" };
}

export async function operationsCore(input: OperationsInput, out: CommandOutput): Promise<void> {
  await out.run(async () => {
    const descriptor = await resolveAccountDescriptor(resolveAccountArg(input.account, []));
    const network = networkStringFromCurrencyId(descriptor.currencyId);
    // accountId remapped to V1 descriptor — internal live-common id is intentionally dropped
    out.setContext({ network, account: serializeV1(toV1(descriptor)) });
    walletCliDebug(`operations: account=${descriptor.id}, limit=${input.limit ?? "default"}`);
    const wallet = new WalletAdapter();
    const page = await out.withActivity(
      `Fetching operations for ${network}…`,
      "Operations fetched",
      () => wallet.getAccountOperations(descriptor, { limit: input.limit, cursor: input.cursor }),
    );
    trackOperationViewed({ network, limit: input.limit, cursor: input.cursor });
    await out.operations(page.operations, descriptor.currencyId, page.nextCursor);
  });
}

export default defineCommand({
  name: "operations",
  description: "List operations for an account (no device required)",
  options: {
    account: accountOption,
    limit: option(operationsInputSchema.shape.limit, {
      description: "Max number of operations to return",
      short: "l",
    }),
    cursor: option(operationsInputSchema.shape.cursor, {
      description: "Pagination cursor from a previous call's nextCursor",
    }),
    output: outputOption,
  },
  handler: async ({ flags, positional }) => {
    const input: OperationsInput = {
      // Required in-schema (so MCP rejects a missing arg); "" fallback routes an absent CLI
      // flag/positional to the core's friendly missing-account guard. See balances.ts.
      account: flags.account ?? positional[0] ?? "",
      limit: flags.limit,
      cursor: flags.cursor,
    };
    const out = createCommandOutput(resolveOutputFormat(flags.output), operationsContext(input));
    await operationsCore(input, out);
  },
});
