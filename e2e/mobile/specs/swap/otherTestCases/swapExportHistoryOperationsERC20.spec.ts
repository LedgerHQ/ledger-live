import { Account, TokenAccount } from "@ledgerhq/live-common/e2e/enum/Account";
import { SwapProvider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { Addresses } from "@ledgerhq/live-common/e2e/enum/Addresses";
import { runExportSwapHistoryOperationsTest } from "./swap.other";

const solMinAmount = "0.07";
const swapId = "1172570f-5a02-43b9-83fc-cad47bfd12f3";

const swapHistoryERC20TestConfig = {
  swap: new Swap(Account.SOL_1, TokenAccount.ETH_USDT_1, solMinAmount),
  provider: SwapProvider.NEAR_INTENTS,
  swapId,
  addressFrom: Addresses.SWAP_HISTORY_ERC20_SOL_FROM,
  addressTo: Addresses.SWAP_HISTORY_ERC20_ETH_USDT_TO,
  tmsLinks: ["B2CQA-604"],
  tags: [
    "@NanoSP",
    "@LNS",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    "@solana",
    "@family-solana",
    "@ethereum",
    "@family-evm",
  ],
};

runExportSwapHistoryOperationsTest(
  swapHistoryERC20TestConfig.swap,
  swapHistoryERC20TestConfig.provider,
  swapHistoryERC20TestConfig.swapId,
  swapHistoryERC20TestConfig.addressFrom,
  swapHistoryERC20TestConfig.addressTo,
  swapHistoryERC20TestConfig.tmsLinks,
  swapHistoryERC20TestConfig.tags,
);
