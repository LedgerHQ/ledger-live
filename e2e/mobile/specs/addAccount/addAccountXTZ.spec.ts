import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { runAddAccountTest } from "@e2e/specs/addAccount/addAccount";

runAddAccountTest({
  currency: Currency.XTZ,
  tmsLinks: ["B2CQA-2507", "B2CQA-2655", "B2CQA-2683"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@tezos`, `@family-tezos`],
});
