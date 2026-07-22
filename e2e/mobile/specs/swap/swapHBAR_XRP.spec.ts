import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Fee } from "@ledgerhq/live-e2e-shared/enum/Fee";
import { runSwapTest } from "./swap";

runSwapTest(
  Account.HEDERA_1,
  Account.XRP_1,
  ["B2CQA-3753"],
  [
    "@NanoSP",
    "@LNS",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    "@hedera",
    "@family-hedera",
    "@ripple",
    "@family-xrp",
  ],
  Fee.MEDIUM,
  // TODO(LIVE-33611): remove hardcoded amount once the swap "min amount for quotes" bug is fixed
  // https://ledgerhq.atlassian.net/browse/LIVE-33611
  "500",
);
