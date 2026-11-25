import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSwapTest } from "@e2e/specs/swap/swap";

runSwapTest({
  accountToDebit: Account.BTC_NATIVE_SEGWIT_1,
  accountToCredit: Account.SOL_1,
  tmsLinks: ["B2CQA-2747"],
  tags: [
    "@NanoSP",
    "@LNS",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    "@bitcoin",
    "@family-bitcoin",
    "@solana",
    "@family-solana",
  ],
});
