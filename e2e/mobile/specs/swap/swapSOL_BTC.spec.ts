import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSwapTest } from "@e2e/specs/swap/swap";

runSwapTest({
  accountToDebit: Account.SOL_1,
  accountToCredit: Account.BTC_NATIVE_SEGWIT_1,
  tmsLinks: ["B2CQA-2776"],
  tags: [
    "@NanoSP",
    "@LNS",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    "@solana",
    "@family-solana",
    "@bitcoin",
    "@family-bitcoin",
  ],
});
