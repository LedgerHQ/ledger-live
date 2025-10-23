import { Provider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { runSwapHistoryOperationsTest } from "./swap.other";

const swapHistoryTestConfig = {
  swap: new Swap(Account.SOL_1, Account.ETH_1, "0.07"),
  provider: Provider.EXODUS,
  swapId: "wQ90NrWdvJz5dA4",
  tmsLinks: ["B2CQA-602"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex"],
};

runSwapHistoryOperationsTest(
  swapHistoryTestConfig.swap,
  swapHistoryTestConfig.provider,
  swapHistoryTestConfig.swapId,
  swapHistoryTestConfig.tmsLinks,
  swapHistoryTestConfig.tags,
);
