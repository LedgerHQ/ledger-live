import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { runAddAccountTest } from "@e2e/specs/addAccount/addAccount";

runAddAccountTest(
  Currency.ETC,
  ["B2CQA-2502"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@ethereum_classic`, `@family-evm`],
);
