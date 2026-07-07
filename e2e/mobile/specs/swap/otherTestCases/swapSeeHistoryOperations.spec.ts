import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { SwapProvider } from "@ledgerhq/live-e2e-shared/enum/Provider";
import { runSwapHistoryOperationsTest } from "./swap.other";

const swapHistoryTestConfig = {
  swap: new Swap(Account.SOL_1, Account.ETH_1, "0.07"),
  provider: SwapProvider.EXODUS,
  swapId: "wQ90NrWdvJz5dA4",
  tmsLinks: ["B2CQA-602"],
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
  details: {
    date: "July 15, 2025",
    sentAmount: "0.07 SOL",
    networkFees: "0.000005 SOL",
    receiveAccount: "Ethereum 1",
  },
};

runSwapHistoryOperationsTest(
  swapHistoryTestConfig.swap,
  swapHistoryTestConfig.provider,
  swapHistoryTestConfig.swapId,
  swapHistoryTestConfig.tmsLinks,
  swapHistoryTestConfig.tags,
  swapHistoryTestConfig.details,
);
