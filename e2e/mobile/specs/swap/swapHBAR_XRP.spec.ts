import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSwapTest } from "@e2e/specs/swap/swap";

runSwapTest({
  accountToDebit: Account.HEDERA_1,
  accountToCredit: Account.XRP_1,
  tmsLinks: ["B2CQA-3753"],
  tags: [
    "@NanoSP",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    "@hedera",
    "@family-hedera",
    "@ripple",
    "@family-xrp",
  ],
});
