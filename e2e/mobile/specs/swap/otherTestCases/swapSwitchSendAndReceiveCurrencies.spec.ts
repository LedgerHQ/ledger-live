import { runSwapSwitchSendAndReceiveCurrenciesTest } from "./swap.other";

const swapSwitchSendAndReceiveCurrenciesTestConfig = {
  swap: new Swap(Account.BTC_NATIVE_SEGWIT_1, Account.ETH_1, "0.03"),
  tmsLinks: ["B2CQA-602"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

runSwapSwitchSendAndReceiveCurrenciesTest(
  swapSwitchSendAndReceiveCurrenciesTestConfig.swap,
  swapSwitchSendAndReceiveCurrenciesTestConfig.tmsLinks,
  swapSwitchSendAndReceiveCurrenciesTestConfig.tags,
);
