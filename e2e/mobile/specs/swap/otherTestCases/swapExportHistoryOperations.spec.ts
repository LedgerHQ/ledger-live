import { Provider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { runExportSwapHistoryOperationsTest } from "./swap.other";

const swapHistoryTestConfig = {
  swap: new Swap(Account.SOL_1, Account.ETH_1, "0.07"),
  provider: Provider.EXODUS,
  swapId: "wQ90NrWdvJz5dA4",
  addressFrom: "9MQyG8qo6i616yApRoRVMXYerGV4swwtd2bDETC3RCWB",
  addressTo: "0x4BE2E2B8872AA298D6d123b9211B53E41f611566",
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
