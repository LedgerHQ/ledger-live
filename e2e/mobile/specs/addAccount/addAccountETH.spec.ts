import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { runAddAccountTest } from "@e2e/specs/addAccount/addAccount";

runAddAccountTest(
  Currency.ETH,
  ["B2CQA-2503"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@ethereum`, `@family-evm`],
);
