import { runSwapWithDifferentSeedTest } from "./swap.other";

const swapTestConfig = {
  swap: new Swap(Account.BTC_NATIVE_SEGWIT_1, Account.ETH_1, "0.002"),
  tmsLinks: ["B2CQA-3090"],
  userData: "speculos-x-other-account",
  errorMessage:
    "This receiving account does not belong to the device you have connected. Please change and retry",
};

runSwapWithDifferentSeedTest(
  swapTestConfig.swap,
  swapTestConfig.userData,
  swapTestConfig.errorMessage,
  swapTestConfig.tmsLinks,
  ["@NanoSP", "@LNS", "@NanoX"],
);
