import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSwapEntryPoints } from "./swap.other";

const swapEntryPointsConfig = {
  account: Account.BTC_NATIVE_SEGWIT_1,
  tmsLinks: ["B2CQA-2784"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

runSwapEntryPoints(
  swapEntryPointsConfig.account,
  swapEntryPointsConfig.tmsLinks,
  swapEntryPointsConfig.tags,
);
