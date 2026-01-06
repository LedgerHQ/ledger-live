import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { runPortfolioTransactionsHistoryTest } from "./portfolio";

runPortfolioTransactionsHistoryTest(
  Currency.ETH,
  ["B2CQA-929"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
);
