import { runSwapEntryPoints } from "./swap.other";

const swapEntryPointsConfig = {
  account: Account.BTC_NATIVE_SEGWIT_1,
  tmsLinks: ["B2CQA-2784"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax"],
};

runSwapEntryPoints(
  swapEntryPointsConfig.account,
  swapEntryPointsConfig.tmsLinks,
  swapEntryPointsConfig.tags,
);
