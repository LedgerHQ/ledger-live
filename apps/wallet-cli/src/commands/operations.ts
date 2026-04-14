import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { setupCalClientStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { WalletAdapter } from "../wallet";
import { HumanFormatter, JsonFormatter } from "../wallet/formatter";
import { parseAccountDescriptor, resolveAccountArg, OutputFormatSchema } from "../wallet/models";
import { toV1, serializeV1, networkStringFromCurrencyId } from "../shared/accountDescriptor";
import { walletCliDebug } from "../shared/log";
import { withSpinner, colors, writeStdout } from "../shared/ui";
import { makeEnvelope, makeErrorEnvelope } from "../shared/response";

export default defineCommand({
  name: "operations",
  description: "List operations for an account descriptor (no device required)",
  options: {
    account: option(z.string().min(1).optional(), {
      description:
        "Short account descriptor (output of account discover), or pass as first positional arg",
      short: "a",
    }),
    limit: option(z.coerce.number().int().min(1).optional(), {
      description: "Max number of operations to return (Alpaca families only)",
      short: "l",
    }),
    cursor: option(z.string().min(1).optional(), {
      description: "Pagination cursor from a previous call's nextCursor (Alpaca families only)",
    }),
    output: option(OutputFormatSchema.default("human"), {
      description: "Output format: human (default) or json",
    }),
  },
  handler: async ({ flags, positional }) => {
    const descriptor = parseAccountDescriptor(resolveAccountArg(flags.account, positional));
    const network = networkStringFromCurrencyId(descriptor.currencyId);
    const descriptorV1Str = serializeV1(toV1(descriptor));
    walletCliDebug(
      `operations: account=${descriptor.id}, limit=${flags.limit ?? "default"}, output=${flags.output}`,
    );
    const wallet = new WalletAdapter();
    const isHuman = flags.output === "human";

    try {
      const page = await withSpinner(
        `Fetching operations for ${network}…`,
        "Operations fetched",
        () => wallet.getAccountOperations(descriptor, { limit: flags.limit, cursor: flags.cursor }),
        isHuman,
      );

      const fmt = new HumanFormatter(setupCalClientStore());
      if (isHuman) {
        for (const op of page.operations) {
          const line = await fmt.formatOperation(op, descriptor.currencyId);
          writeStdout(op.parentId ? `  ${line}` : line);
        }
        if (page.nextCursor) {
          const cursorLabel = colors.dim(`nextCursor: ${page.nextCursor}`);
          process.stderr.write(`\n${cursorLabel}\n`);
        }
      } else {
        // accountId remapped to V1 descriptor — internal live-common id is intentionally dropped
        const jsonFmt = new JsonFormatter(fmt);
        const jsonOperations = await jsonFmt.operations(
          page.operations,
          descriptor.currencyId,
          descriptorV1Str,
        );
        writeStdout(
          JSON.stringify(
            makeEnvelope(
              "operations",
              network,
              { operations: jsonOperations, nextCursor: page.nextCursor },
              descriptor.id,
            ),
            null,
            2,
          ),
        );
      }
    } catch (e) {
      if (isHuman) throw e;
      writeStdout(
        JSON.stringify(
          makeErrorEnvelope("operations", HumanFormatter.formatError(e), network),
          null,
          2,
        ),
      );
      process.exit(1);
    }
  },
});
