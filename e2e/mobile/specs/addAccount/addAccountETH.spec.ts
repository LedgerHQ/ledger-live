import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { runAddAccountTest } from "./addAccount";

runAddAccountTest(
  Currency.ETH,
  ["B2CQA-2503", "B2CQA-2645", "B2CQA-2673"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@ethereum`, `@family-evm`],
);
