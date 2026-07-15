import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { runAddAccountTest } from "./addAccount";

runAddAccountTest(
  Currency.ETC,
  ["B2CQA-2502", "B2CQA-2646", "B2CQA-2674"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@ethereum_classic`, `@family-evm`],
);
