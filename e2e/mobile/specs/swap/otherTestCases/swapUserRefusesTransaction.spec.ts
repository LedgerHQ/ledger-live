import { runUserRefusesTransactionTest } from "./swap.other";

const userRefusesTransactionSwapTestConfig = {
  fromAccount: Account.ETH_1,
  toAccount: Account.SOL_1,
  tmsLinks: ["B2CQA-2212"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex"],
};

runUserRefusesTransactionTest(
  userRefusesTransactionSwapTestConfig.fromAccount,
  userRefusesTransactionSwapTestConfig.toAccount,
  userRefusesTransactionSwapTestConfig.tmsLinks,
  userRefusesTransactionSwapTestConfig.tags,
);
