import { Addresses } from "@ledgerhq/live-common/lib/e2e/enum/Addresses";
import { runSwapWithDifferentSeedTest } from "./swap.other";

const swapTestConfig = {
  swap: new Swap(Account.ETH_1, Account.SOL_1, "0.03"),
  tmsLinks: ["B2CQA-3089"],
  userData: "speculos-x-other-account",
  errorMessage:
    "This sending account does not belong to the connected device. Please change and retry.",
  addressFrom: Addresses.ETH_OTHER_SEED,
  addressTo: Addresses.SOL_OTHER_SEED,
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
