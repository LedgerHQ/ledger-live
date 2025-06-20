import { Provider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { runExportSwapHistoryOperationsTest } from "./swap.other";

const swapHistoryTestConfig = {
  swap: new Swap(Account.ETH_1, Account.XLM_1, "0.008"),
  provider: Provider.CHANGELLY,
  swapId: "fmwnt4mc0tiz75kz",
  tmsLinks: ["B2CQA-604"],
  tags: ["@NanoSP", "@LNS", "@NanoX"],
};

runExportSwapHistoryOperationsTest(
  swapHistoryTestConfig.swap,
  swapHistoryTestConfig.provider,
  swapHistoryTestConfig.swapId,
  swapHistoryTestConfig.tmsLinks,
  swapHistoryTestConfig.tags,
);
