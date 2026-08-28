import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { runAddAccountTest } from "@e2e/specs/addAccount/addAccount";

runAddAccountTest(
  Currency.BASE,
  ["B2CQA-4226"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@base`, `@family-evm`],
);
