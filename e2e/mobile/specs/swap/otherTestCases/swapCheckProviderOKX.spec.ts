import { SwapProvider } from "@ledgerhq/live-e2e-shared/enum/Provider";
import { runSwapDexNativeFlow } from "@e2e/specs/swap/otherTestCases/swapDexNativeFlow";

const swapCheckProviderTestConfig = {
  fromAccount: TokenAccount.ETH_USDT_5,
  toAccount: Account.ETH_5,
  provider: SwapProvider.OKX,
  tmsLinks: ["B2CQA-4728"],
  tags: ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
};

runSwapDexNativeFlow(
  swapCheckProviderTestConfig.fromAccount,
  swapCheckProviderTestConfig.toAccount,
  swapCheckProviderTestConfig.provider,
  swapCheckProviderTestConfig.tmsLinks,
  swapCheckProviderTestConfig.tags,
);
