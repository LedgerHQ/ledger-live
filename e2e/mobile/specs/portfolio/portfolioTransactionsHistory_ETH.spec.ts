import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runPortfolioTransactionsHistoryTest } from "./portfolio";

runPortfolioTransactionsHistoryTest(
  Account.ETH_2,
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
  Account.ETH_2.accountName,
);
