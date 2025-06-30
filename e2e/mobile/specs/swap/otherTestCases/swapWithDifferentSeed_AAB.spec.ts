import { runSwapWithDifferentSeedTest } from "./swap.other";

const swapTestConfig = {
  swap: new Swap(Account.ETH_1, Account.SOL_1, "0.03"),
  tmsLinks: ["B2CQA-3089"],
  userData: "speculos-x-other-account",
  errorMessage:
    "This receiving account does not belong to the device you have connected. Please change and retry",
  tags: ["@NanoSP", "@LNS", "@NanoX"],
};

runSwapWithDifferentSeedTest(
  swapTestConfig.swap,
  swapTestConfig.userData,
  swapTestConfig.errorMessage,
  swapTestConfig.tmsLinks,
  swapTestConfig.tags,
);
