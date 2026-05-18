import { Provider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { runSwapReapprovalFlow } from "./swapReapprovalFlow";

const eligibleProviders = [
  { provider: Provider.THORCHAIN },
  { provider: Provider.LIFI },
  { provider: Provider.OKX },
];
const seed = Math.floor(Date.now() / 60_000);
const randomizedSeed = Math.abs(Math.sin(seed + 1));
const { provider } = eligibleProviders[Math.floor(randomizedSeed * eligibleProviders.length)];

const swapReapprovalFlowTestConfig = {
  fromAccount: TokenAccount.ETH_USDC_1,
  toAccount: Account.ETH_1,
  provider,
  tmsLinks: ["B2CQA-4012"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
};

runSwapReapprovalFlow(
  swapReapprovalFlowTestConfig.fromAccount,
  swapReapprovalFlowTestConfig.toAccount,
  swapReapprovalFlowTestConfig.provider,
  swapReapprovalFlowTestConfig.tmsLinks,
  swapReapprovalFlowTestConfig.tags,
);
