import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { runAddAccountTest } from "./addAccount";

runAddAccountTest(
  Currency.TRX,
  ["B2CQA-2508", "B2CQA-2649", "B2CQA-2677"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@tron`, `@family-tron`],
);
