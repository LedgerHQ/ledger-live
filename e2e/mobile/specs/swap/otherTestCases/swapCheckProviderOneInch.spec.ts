import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { SwapProvider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { runSwapDexNativeFlow } from "./swapDexNativeFlow";

const swapCheckProviderTestConfig = {
  fromAccount: Account.ETH_1,
  toAccount: TokenAccount.ETH_USDT_1,
  provider: SwapProvider.ONE_INCH,
  tmsLinks: ["B2CQA-3120"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
};

runSwapDexNativeFlow(
  swapCheckProviderTestConfig.fromAccount,
  swapCheckProviderTestConfig.toAccount,
  swapCheckProviderTestConfig.provider,
  swapCheckProviderTestConfig.tmsLinks,
  swapCheckProviderTestConfig.tags,
);
