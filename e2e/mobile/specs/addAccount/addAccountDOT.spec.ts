import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { runAddAccountTest } from "./addAccount";

runAddAccountTest(
  Currency.DOT,
  ["B2CQA-2504", "B2CQA-2648", "B2CQA-2676"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@polkadot`, `@family-polkadot`],
);
