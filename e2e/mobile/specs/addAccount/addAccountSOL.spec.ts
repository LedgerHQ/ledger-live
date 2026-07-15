import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { runAddAccountTest } from "./addAccount";

runAddAccountTest(
  Currency.SOL,
  ["B2CQA-2642", "B2CQA-2656", "B2CQA-2684"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@solana`, `@family-solana`],
);
