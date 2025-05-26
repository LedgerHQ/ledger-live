import { runSwapWithDifferentSeedTest } from "./swap.other";

const transactionE2E = {
  swap: new Swap(Account.ETH_1, Account.SOL_1, "0.03"),
  tmsLinks: ["B2CQA-3089"],
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
