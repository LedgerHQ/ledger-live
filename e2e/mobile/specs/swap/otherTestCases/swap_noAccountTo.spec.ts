import { runSwapWithoutAccountTest } from "./swap.other";

const noAccountToTestConfig = {
  account1: Account.ETH_1,
  account2: Account.BTC_NATIVE_SEGWIT_1,
  testTitle: "from Account present to Account not present",
  tmsLinks: ["B2CQA-3354"],
};

runSwapWithoutAccountTest(
  noAccountToTestConfig.account1,
  noAccountToTestConfig.account2,
  noAccountToTestConfig.testTitle,
  noAccountToTestConfig.tmsLinks,
  "noAccountTo",
  ["@NanoSP", "@LNS", "@NanoX"],
);
