import { Provider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { runSwapTokenApprovalFlow } from "./swapTokenApprovalFlow";
import { pickRotatingProvider } from "@ledgerhq/live-common/e2e/swap";

const eligibleProviders = [
  Provider.THORCHAIN,
  Provider.UNISWAP,
  Provider.LIFI,
  Provider.OKX,
  // 1inch and Velora are Ethereum plugin apps (applicationType: "plugin", parent: Ethereum).
  // They cannot be launched as a main Speculos app — the process exits before the signing step,
  // causing ECONNREFUSED on the Speculos API port at speculos.signTokenApproval(). See QAA-1236.
  // Provider.ONE_INCH,
  // Provider.VELORA,
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
