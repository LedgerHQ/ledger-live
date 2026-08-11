import { runSwapWithoutAccountTest } from "./swap.other";

const noAccountFromTestConfig = {
  account1: Account.BTC_NATIVE_SEGWIT_1,
  account2: Account.ETH_1,
  testTitle: "Swap from account not present to account present",
  tmsLinks: ["B2CQA-3353"],
  tags: [
    "@NanoSP",
    "@LNS",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    "@bitcoin",
    "@family-bitcoin",
    "@ethereum",
    "@family-evm",
  ],
};

runSwapWithoutAccountTest(
  noAccountFromTestConfig.account1,
  noAccountFromTestConfig.account2,
  noAccountFromTestConfig.testTitle,
  noAccountFromTestConfig.tmsLinks,
  "noAccountFrom",
  noAccountFromTestConfig.tags,
);
