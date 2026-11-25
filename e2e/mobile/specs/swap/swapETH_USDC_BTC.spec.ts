import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSwapTest } from "@e2e/specs/swap/swap";

runSwapTest({
  accountToDebit: TokenAccount.ETH_USDC_1,
  accountToCredit: Account.BTC_NATIVE_SEGWIT_1,
  tmsLinks: ["B2CQA-2832", "B2CQA-3281"],
  tags: [
    "@NanoSP",
    "@LNS",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    "@ethereum",
    "@family-evm",
    "@bitcoin",
    "@family-bitcoin",
  ],
});
