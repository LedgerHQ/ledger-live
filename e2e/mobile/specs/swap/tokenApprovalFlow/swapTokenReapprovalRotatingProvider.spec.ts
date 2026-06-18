import { SwapProvider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { runSwapTokenReapprovalFlow } from "./swapTokenReapprovalFlow";

const eligibleProviders = [
  SwapProvider.THORCHAIN,
  SwapProvider.LIFI,
  SwapProvider.OKX,
  SwapProvider.ONE_INCH,
  SwapProvider.VELORA,
];

const swapTokenReapprovalFlowTestConfig = {
  fromAccount: TokenAccount.ETH_USDT_1,
  toAccount: Account.ETH_1,
  providers: eligibleProviders,
  tmsLinks: ["B2CQA-4012"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
};

runSwapTokenReapprovalFlow(
  swapTokenReapprovalFlowTestConfig.fromAccount,
  swapTokenReapprovalFlowTestConfig.toAccount,
  swapTokenReapprovalFlowTestConfig.providers,
  swapTokenReapprovalFlowTestConfig.tmsLinks,
  swapTokenReapprovalFlowTestConfig.tags,
);
