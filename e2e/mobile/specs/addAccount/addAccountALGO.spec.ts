import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { runAddAccountTest } from "@e2e/specs/addAccount/addAccount";

runAddAccountTest({
  currency: Currency.ALGO,
  tmsLinks: ["B2CQA-2497", "B2CQA-2653", "B2CQA-2681"],
  tags: [
    "@NanoSP",
    "@LNS",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    `@algorand`,
    `@family-algorand`,
  ],
});
