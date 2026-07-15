import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { runAddAccountTest } from "./addAccount";

runAddAccountTest(
  Currency.XRP,
  ["B2CQA-2505", "B2CQA-2647", "B2CQA-2675"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@ripple`, `@family-xrp`],
);
