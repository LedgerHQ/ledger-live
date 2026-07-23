import { SwapProvider } from "@ledgerhq/live-e2e-shared/enum/Provider";
import { runSwapCrossAccountTest } from "./swap.crossAccount";

const dexProviders = [
  SwapProvider.ONE_INCH,
  SwapProvider.VELORA,
  SwapProvider.UNISWAP,
  SwapProvider.OKX,
];
const fromAccount = TokenAccount.ETH_USDT_1;
const toAccount = Account.ETH_3;

const swapCrossAccountTestConfig = {
  fromAccount,
  toAccount,
  dexProviders,
  tmsLinks: ["LIVE-19543"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
};

runSwapCrossAccountTest(
  swapCrossAccountTestConfig.fromAccount,
  swapCrossAccountTestConfig.toAccount,
  swapCrossAccountTestConfig.dexProviders,
  swapCrossAccountTestConfig.tmsLinks,
  swapCrossAccountTestConfig.tags,
);
