import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { runAddAccountTest } from "./addAccount";

runAddAccountTest(
  Currency.TRX,
  ["B2CQA-2508", "B2CQA-2649", "B2CQA-2677"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@tron`, `@family-tron`],
);
