import { defineCommand, option } from "@bunli/core";
import { BigNumber } from "bignumber.js";
import { z } from "zod";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { makeBridgeCacheSystem } from "@ledgerhq/live-common/bridge/cache";
import {
  findCryptoCurrencyById,
  parseCurrencyUnit,
} from "@ledgerhq/live-common/lib-es/currencies/index";
import { integrateNewAccountDescriptor } from "@ledgerhq/live-wallet/walletsync/modules/accounts";
import { createCommandOutput } from "../../output";
import {
  accountOption,
  outputOption,
  resolveAccountArg,
  resolveAccountDescriptor,
} from "../inputs";
import { networkStringFromCurrencyId } from "../../shared/accountDescriptor";
import { runFullSwapPipeline } from "./cli-swap-pipeline";

export default defineCommand({
  name: "execute",
  description:
    "Swap flow with Ledger device + API pipeline (nonce → payload → complete exchange → sign/broadcast).",
  options: {
    provider: option(z.string().min(1, "Provider is required (--provider <name>)"), {
      description: "Swap provider name, e.g. changelly",
    }),
    amount: option(z.string().min(1, "Amount is required (--amount <value>)"), {
      description: "Swap source amount in human units",
    }),
    "to-account": option(z.string().min(1), {
      description: "Destination account descriptor or session label (required for full pipeline)",
    }),
    account: accountOption,
    "fee-strategy": option(z.enum(["slow", "medium", "fast"]).default("medium"), {
      description: "Fee strategy for the refund-chain transaction (full pipeline)",
    }),
    output: outputOption,
  },
  handler: async ({ flags, positional }) => {
    const fromDescriptor = await resolveAccountDescriptor(
      resolveAccountArg(flags.account, positional),
    );
    const fromCurrency = findCryptoCurrencyById(fromDescriptor.currencyId);
    if (!fromCurrency) {
      throw new Error(`Currency ${fromDescriptor.currencyId} not found`);
    }

    const amountInAtomicUnit: BigNumber = parseCurrencyUnit(fromCurrency.units[0], flags.amount);

    const network = networkStringFromCurrencyId(fromDescriptor.currencyId);

    const out = createCommandOutput(resolveOutputFormat(flags.output), {
      command: "swap execute",
      network,
    });

    await out.run(async () => {
      const syncCache = makeBridgeCacheSystem({
        saveData: async () => {},
        getData: async () => undefined,
      });

      const toAccountArg = flags["to-account"];
      if (!toAccountArg) {
        throw new Error("Swap execute requires --to-account <descriptor-or-label>.");
      }
      const toDescriptor = await resolveAccountDescriptor(toAccountArg);

      out.swapExecuteProgress(
        `[i] Syncing source (${fromDescriptor.id}) and destination (${toDescriptor.id}) accounts…`,
      );
      const [fromAccount, toAccount] = await Promise.all([
        integrateNewAccountDescriptor(fromDescriptor, getAccountBridge, syncCache),
        integrateNewAccountDescriptor(toDescriptor, getAccountBridge, syncCache),
      ]);

      const result = await runFullSwapPipeline({
        out,
        provider: flags.provider,
        amount: flags.amount,
        amountInAtomicUnit,
        feeStrategy: flags["fee-strategy"],
        fromAccount,
        toAccount,
      });

      out.swapExecuteFullResult({
        provider: flags.provider,
        amount: flags.amount,
        transactionId: result.transactionId,
        payload: result.payload,
        operationHash: result.operationHash,
        swapId: result.swapId,
        amountExpectedTo: result.amountExpectedTo,
        magnitudeAwareRate: result.magnitudeAwareRate,
      });
    });
  },
});
