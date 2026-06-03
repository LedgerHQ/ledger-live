import { SwapProvider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { runSwapTokenApprovalFlow } from "./swapTokenApprovalFlow";
import { pickRotatingProvider } from "@ledgerhq/live-common/e2e/swap";

const eligibleProviders = [
  SwapProvider.THORCHAIN,
  SwapProvider.UNISWAP,
  SwapProvider.LIFI,
  SwapProvider.OKX,
  SwapProvider.ONE_INCH,
  SwapProvider.VELORA,
];
const provider = pickRotatingProvider(eligibleProviders);

const swapTokenApprovalFlowTestConfig = {
  fromAccount: TokenAccount.ETH_USDC_1,
  toAccount: Account.ETH_1,
  provider,
  tmsLinks: ["B2CQA-5632"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
};

runSwapTokenApprovalFlow(
  swapTokenApprovalFlowTestConfig.fromAccount,
  swapTokenApprovalFlowTestConfig.toAccount,
  swapTokenApprovalFlowTestConfig.provider,
  swapTokenApprovalFlowTestConfig.tmsLinks,
  swapTokenApprovalFlowTestConfig.tags,
);
