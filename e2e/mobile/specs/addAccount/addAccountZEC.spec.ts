import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { runAddAccountTest } from "./addAccount";

runAddAccountTest(
  Currency.ZEC,
  ["B2CQA-4296", "B2CQA-4297", "B2CQA-4298"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@zcash`, `@family-zcash`],
);
