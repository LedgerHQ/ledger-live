import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runUserRefusesTransactionTest } from "./swap.other";

const userRefusesTransactionSwapTestConfig = {
  fromAccount: Account.ETH_1,
  toAccount: Account.SOL_1,
  tmsLinks: ["B2CQA-2212"],
  tags: [
    "@NanoSP",
    "@LNS",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    "@ethereum",
    "@family-evm",
    "@solana",
    "@family-solana",
  ],
};

runUserRefusesTransactionTest(
  userRefusesTransactionSwapTestConfig.fromAccount,
  userRefusesTransactionSwapTestConfig.toAccount,
  userRefusesTransactionSwapTestConfig.tmsLinks,
  userRefusesTransactionSwapTestConfig.tags,
);
