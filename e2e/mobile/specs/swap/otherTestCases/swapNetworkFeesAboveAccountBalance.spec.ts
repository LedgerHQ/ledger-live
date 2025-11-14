import { runSwapNetworkFeesAboveAccountBalanceTest } from "./swap.other";

const testConfig = {
  swap: new Swap(TokenAccount.ETH_USDT_2, Account.BTC_NATIVE_SEGWIT_1, "USE_MIN_AMOUNT"),
  errorMessage: new RegExp(/\d+(\.\d{1,10})? ETH needed for network fees\.[\s\S]*Learn More/),
  tmsLinks: ["B2CQA-2363"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex"],
};

runSwapNetworkFeesAboveAccountBalanceTest(
  testConfig.swap,
  testConfig.errorMessage,
  testConfig.tmsLinks,
  testConfig.tags,
);
