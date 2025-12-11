import { runSwapWithDifferentSeedTest } from "./swap.other";

const swapTestConfig = {
  swap: new Swap(Account.ETH_1, Account.SOL_1, "0.03"),
  tmsLinks: ["B2CQA-3089"],
  userData: "speculos-x-other-account",
  errorMessage:
    "This sending account does not belong to the connected device. Please change and retry.",
  addressFrom: "0xce12D0A5cFf4A88ECab96ff8923215Dff366127b",
  addressTo: "DLVArScX1BQEr7gZSSpHMGMq7HKKFKdFF82Cs6PvEKVC",
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
