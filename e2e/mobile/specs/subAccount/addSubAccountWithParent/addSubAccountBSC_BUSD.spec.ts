import { runAddSubAccountTest } from "../subAccount";

const testConfig = {
  account: Account.BSC_BUSD_1,
  tmslinks: ["B2CQA-2489"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex"],
  withParentAccount: true,
};

runAddSubAccountTest(
  testConfig.account,
  testConfig.tmslinks,
  testConfig.tags,
  testConfig.withParentAccount,
);
//pas ok - probleme de id - bsc a la place de BNB Binance ...
