import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSwapWithDifferentSeedTest } from "./swap.other";
import { Addresses } from "@ledgerhq/live-common/lib/e2e/enum/Addresses";

const swapTestConfig = {
  swap: new Swap(Account.ETH_1, Account.BTC_NATIVE_SEGWIT_1, "0.03"),
  tmsLinks: ["B2CQA-3091"],
  userData: "speculos-x-other-account",
  errorMessage:
    "This sending account does not belong to the connected device. Please change and retry.",
  addressFrom: Addresses.ETH_OTHER_SEED,
  addressTo: Addresses.BTC_NATIVE_SEGWIT_1,
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
