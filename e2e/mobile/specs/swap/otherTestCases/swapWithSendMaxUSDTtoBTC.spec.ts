import { runSwapWithSendMaxTest } from "./swap.other";

const swapWithSendMaxConfig = {
  fromAccount: TokenAccount.ETH_USDT_1,
  toAccount: Account.BTC_NATIVE_SEGWIT_1,
  tmsLinks: ["B2CQA-3366"],
  tags: ["@NanoSP", "@LNS", "@NanoX"],
};

runSwapWithSendMaxTest(
  swapWithSendMaxConfig.fromAccount,
  swapWithSendMaxConfig.toAccount,
  swapWithSendMaxConfig.tmsLinks,
  swapWithSendMaxConfig.tags,
);
