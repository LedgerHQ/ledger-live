import { runSwapWithDifferentSeedTest } from "./swap.other";

const swapTestConfig = {
  swap: new Swap(Account.BTC_NATIVE_SEGWIT_1, Account.ETH_1, "0.002"),
  tmsLinks: ["B2CQA-3090"],
  userData: "speculos-x-other-account",
  errorMessage: null,
  addressFrom: "bc1qcy8hnxctr03mh62cu00y0wphmfpa2gwr7elje5",
  addressTo: "0xce12D0A5cFf4A88ECab96ff8923215Dff366127b",
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

runSwapWithDifferentSeedTest(
  swapTestConfig.swap,
  swapTestConfig.userData,
  swapTestConfig.errorMessage,
  swapTestConfig.addressFrom,
  swapTestConfig.addressTo,
  swapTestConfig.tmsLinks,
  swapTestConfig.tags,
);
