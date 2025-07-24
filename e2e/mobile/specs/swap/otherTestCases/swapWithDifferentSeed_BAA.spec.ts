import { runSwapWithDifferentSeedTest } from "./swap.other";

const swapTestConfig = {
  swap: new Swap(Account.ETH_1, Account.BTC_NATIVE_SEGWIT_1, "0.03"),
  tmsLinks: ["B2CQA-3091"],
  userData: "speculos-x-other-account",
  errorMessage:
    "This sending account does not belong to the connected device. Please change and retry.",
  tags: ["@NanoSP", "@LNS", "@NanoX"],
};

runSwapWithDifferentSeedTest(
  swapTestConfig.swap,
  swapTestConfig.userData,
  swapTestConfig.errorMessage,
  swapTestConfig.tmsLinks,
  swapTestConfig.tags,
);
