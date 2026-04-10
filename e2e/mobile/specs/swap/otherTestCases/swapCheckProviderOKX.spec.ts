import { Provider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { runSwapDexNativeFlow } from "./swapDexNativeFlow";

const swapCheckProviderTestConfig = {
  fromAccount: TokenAccount.ETH_USDT_1,
  toAccount: Account.ETH_1,
  provider: Provider.OKX,
  tmsLinks: ["B2CQA-4728"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
};

runSwapDexNativeFlow(
  swapCheckProviderTestConfig.fromAccount,
  swapCheckProviderTestConfig.toAccount,
  swapCheckProviderTestConfig.provider,
  swapCheckProviderTestConfig.tmsLinks,
  swapCheckProviderTestConfig.tags,
);
