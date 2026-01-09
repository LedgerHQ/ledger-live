import { Addresses } from "@ledgerhq/live-common/lib/e2e/enum/Addresses";
import { runSwapWithDifferentSeedTest } from "./swap.other";

const swapTestConfig = {
  swap: new Swap(Account.BTC_NATIVE_SEGWIT_1, Account.ETH_1, "0.002"),
  tmsLinks: ["B2CQA-3090"],
  userData: "speculos-x-other-account",
  errorMessage: null,
  addressFrom: Addresses.BTC_NATIVE_SEGWIT_1,
  addressTo: Addresses.ETH_OTHER_SEED,
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
