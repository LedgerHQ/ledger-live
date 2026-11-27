import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { runAddAccountTest } from "@e2e/specs/addAccount/addAccount";

runAddAccountTest({
  currency: Currency.GRAM,
  tmsLinks: ["B2CQA-2643", "B2CQA-2657", "B2CQA-2685"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@ton`, `@family-ton`],
});
