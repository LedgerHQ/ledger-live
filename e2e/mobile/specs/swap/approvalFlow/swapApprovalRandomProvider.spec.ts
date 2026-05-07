import { Provider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { runSwapApprovalFlow } from "./swapApprovalFlow";

const eligibleProviders = [
  { provider: Provider.THORCHAIN },
  { provider: Provider.UNISWAP },
  { provider: Provider.LIFI },
  { provider: Provider.OKX },
  // { provider: Provider.ONE_INCH },
  // { provider: Provider.VELORA },
];
const seed = Math.floor(Date.now() / 60_000);
const randomizedSeed = Math.abs(Math.sin(seed + 1));
const { provider } = eligibleProviders[Math.floor(randomizedSeed * eligibleProviders.length)];

const swapApprovalFlowTestConfig = {
  fromAccount: TokenAccount.ETH_USDC_1,
  toAccount: Account.ETH_1,
  provider,
  tmsLinks: ["B2CQA-5632"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
};

runSwapApprovalFlow(
  swapApprovalFlowTestConfig.fromAccount,
  swapApprovalFlowTestConfig.toAccount,
  swapApprovalFlowTestConfig.provider,
  swapApprovalFlowTestConfig.tmsLinks,
  swapApprovalFlowTestConfig.tags,
);
