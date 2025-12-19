import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Provider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { Addresses } from "@ledgerhq/live-common/e2e/enum/Addresses";
import { runExportSwapHistoryOperationsTest } from "./swap.other";

const swapHistoryTestConfig = {
  swap: new Swap(Account.SOL_1, Account.ETH_1, "0.07"),
  provider: Provider.EXODUS,
  swapId: "wQ90NrWdvJz5dA4",
  addressFrom: Addresses.SWAP_HISTORY_SOL_FROM,
  addressTo: Addresses.SWAP_HISTORY_ETH_TO,
  tmsLinks: ["B2CQA-604"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

runExportSwapHistoryOperationsTest(
  swapHistoryTestConfig.swap,
  swapHistoryTestConfig.provider,
  swapHistoryTestConfig.swapId,
  swapHistoryTestConfig.addressFrom,
  swapHistoryTestConfig.addressTo,
  swapHistoryTestConfig.tmsLinks,
  swapHistoryTestConfig.tags,
);
