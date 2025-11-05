import { Provider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { runSwapCheckProvider } from "./swap.other";

const swapCheckProviderTestConfig = {
  fromAccount: Account.ETH_1,
  toAccount: TokenAccount.ETH_USDT_1,
  provider: Provider.VELORA,
  tmsLinks: ["B2CQA-3119"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax"],
};

runSwapCheckProvider(
  swapCheckProviderTestConfig.fromAccount,
  swapCheckProviderTestConfig.toAccount,
  swapCheckProviderTestConfig.provider,
  swapCheckProviderTestConfig.tmsLinks,
  swapCheckProviderTestConfig.tags,
);
