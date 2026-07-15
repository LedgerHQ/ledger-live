import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { runAddAccountTest } from "./addAccount";

runAddAccountTest(
  Currency.ADA,
  ["B2CQA-2500", "B2CQA-2650", "B2CQA-2678"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@cardano`, `@family-cardano`],
);
