import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { runAddAccountTest } from "specs/addAccount/addAccount";

runAddAccountTest(
  Currency.DOT,
  ["B2CQA-2504"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@polkadot`, `@family-polkadot`],
);
