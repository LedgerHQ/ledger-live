import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { runAddAccountTest } from "./addAccount";

runAddAccountTest(
  Currency.BCH,
  ["B2CQA-2498", "B2CQA-2652", "B2CQA-2680"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@bitcoin_cash`, `@family-bitcoin`],
);
