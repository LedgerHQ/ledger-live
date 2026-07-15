import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { runAddAccountTest } from "./addAccount";

runAddAccountTest(
  Currency.ATOM,
  ["B2CQA-2501", "B2CQA-2654", "B2CQA-2682"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@cosmos`, `@family-cosmos`],
);
