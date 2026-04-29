import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { WalletAdapter } from "../wallet";
import { toV1, serializeV1, networkStringFromCurrencyId } from "../shared/accountDescriptor";
import { walletCliDebug } from "../shared/log";
import { createCommandOutput } from "../output";
import { accountOption, outputOption, resolveAccountArg, resolveAccountDescriptor } from "./inputs";

export default defineCommand({
  name: "operations",
  description: "List operations for an account descriptor (no device required)",
  options: {
    account: accountOption,
    limit: option(z.coerce.number().int().min(1).optional(), {
      description: "Max number of operations to return (Alpaca families only)",
      short: "l",
    }),
    cursor: option(z.string().min(1).optional(), {
      description: "Pagination cursor from a previous call's nextCursor (Alpaca families only)",
    }),
    output: outputOption,
  },
  handler: async ({ flags, positional }) => {
    const ctx = { command: "operations", network: "", account: "" };
    const out = createCommandOutput(flags.output, ctx);
    const wallet = new WalletAdapter();


    await out.run(async () => {
      const descriptor = await resolveAccountDescriptor(resolveAccountArg(flags.account, positional));
      ctx.network = networkStringFromCurrencyId(descriptor.currencyId);
      // accountId remapped to V1 descriptor — internal live-common id is intentionally dropped
      ctx.account = serializeV1(toV1(descriptor));
      walletCliDebug(
        `operations: account=${descriptor.id}, limit=${flags.limit ?? "default"}, output=${flags.output}`,
      );
      const page = await out.withActivity(
        `Fetching operations for ${ctx.network}…`,
        "Operations fetched",
        () => wallet.getAccountOperations(descriptor, { limit: flags.limit, cursor: flags.cursor }),
      );
      await out.operations(page.operations, descriptor.currencyId, page.nextCursor);
    });
  },
});
