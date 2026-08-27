import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { runAddAccountTest } from "specs/addAccount/addAccount";

runAddAccountTest(
  Currency.BCH,
  ["B2CQA-2498"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@bitcoin_cash`, `@family-bitcoin`],
);
