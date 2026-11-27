import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { runAddAccountTest } from "@e2e/specs/addAccount/addAccount";

runAddAccountTest({
  currency: Currency.APT,
  tmsLinks: ["B2CQA-3644", "B2CQA-3645", "B2CQA-3646"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@aptos", "@family-aptos"],
});
