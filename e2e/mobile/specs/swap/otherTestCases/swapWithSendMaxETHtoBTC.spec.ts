import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSwapWithSendMaxTest } from "./swap.other";

const swapWithSendMaxConfig = {
  fromAccount: Account.ETH_1,
  toAccount: Account.BTC_NATIVE_SEGWIT_1,
  tmsLinks: ["B2CQA-3365"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

runSwapWithSendMaxTest(
  swapWithSendMaxConfig.fromAccount,
  swapWithSendMaxConfig.toAccount,
  swapWithSendMaxConfig.tmsLinks,
  swapWithSendMaxConfig.tags,
);
