import { SwapProvider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { runSwapTokenReapprovalFlow } from "./swapTokenReapprovalFlow";
import { pickRotatingProvider } from "@ledgerhq/live-common/e2e/swap";

const eligibleProviders = [
  SwapProvider.THORCHAIN,
  SwapProvider.LIFI,
  SwapProvider.OKX,
  SwapProvider.ONE_INCH,
  SwapProvider.VELORA,
];
const provider = pickRotatingProvider(eligibleProviders);

const swapTokenReapprovalFlowTestConfig = {
  fromAccount: TokenAccount.ETH_USDC_1,
  toAccount: Account.ETH_1,
  provider,
  tmsLinks: ["B2CQA-4012"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
};

runSwapTokenReapprovalFlow(
  swapTokenReapprovalFlowTestConfig.fromAccount,
  swapTokenReapprovalFlowTestConfig.toAccount,
  swapTokenReapprovalFlowTestConfig.provider,
  swapTokenReapprovalFlowTestConfig.tmsLinks,
  swapTokenReapprovalFlowTestConfig.tags,
);
