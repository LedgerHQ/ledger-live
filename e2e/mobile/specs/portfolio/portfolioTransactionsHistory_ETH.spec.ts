import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runPortfolioTransactionsHistoryTest } from "./portfolio";

runPortfolioTransactionsHistoryTest(
  Account.ETH_1,
  ["B2CQA-929"],
  [
    "@NanoSP",
    "@LNS",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    "@smoke",
    "@ethereum",
    "@family-evm",
  ],
  Account.ETH_1.accountName,
);
