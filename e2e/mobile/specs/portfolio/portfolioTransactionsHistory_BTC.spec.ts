import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { runPortfolioTransactionsHistoryTest } from "./portfolio";

runPortfolioTransactionsHistoryTest(
  Currency.BTC,
  ["B2CQA-2073"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
);
