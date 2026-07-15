import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runPortfolioTransactionsHistoryTest } from "./portfolio";

runPortfolioTransactionsHistoryTest(
  Account.BTC_NATIVE_SEGWIT_1,
  ["B2CQA-2073"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@bitcoin`, `@family-bitcoin`],
);
