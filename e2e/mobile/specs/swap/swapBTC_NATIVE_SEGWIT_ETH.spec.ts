import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSwapTest } from "@e2e/specs/swap/swap";

runSwapTest({
  accountToDebit: Account.BTC_NATIVE_SEGWIT_1,
  accountToCredit: Account.ETH_1,
  tmsLinks: ["B2CQA-2744", "B2CQA-2432", "B2CQA-3450"],
  tags: [
    "@NanoSP",
    "@LNS",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    "@swapSmoke",
    "@ethereum",
    "@family-evm",
    "@bitcoin",
    "@family-bitcoin",
  ],
});
