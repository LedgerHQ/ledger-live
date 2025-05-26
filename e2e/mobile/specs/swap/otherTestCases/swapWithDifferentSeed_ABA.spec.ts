import { runSwapWithDifferentSeedTest } from "./swap.other";

const transactionE2E = {
  swap: new Swap(Account.BTC_NATIVE_SEGWIT_1, Account.ETH_1, "0.002"),
  tmsLinks: ["B2CQA-3090"],
  userData: "speculos-x-other-account",
  errorMessage:
    "This receiving account does not belong to the device you have connected. Please change and retry",
};

runSwapWithDifferentSeedTest(
  transactionE2E.swap,
  transactionE2E.userData,
  transactionE2E.errorMessage,
  transactionE2E.tmsLinks,
);
