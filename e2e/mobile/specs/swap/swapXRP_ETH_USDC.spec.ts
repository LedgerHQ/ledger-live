import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSwapTest } from "@e2e/specs/swap/swap";

runSwapTest({
  accountToDebit: Account.XRP_1,
  accountToCredit: TokenAccount.ETH_USDC_1,
  tmsLinks: ["B2CQA-3075"],
  tags: [
    "@NanoSP",
    "@LNS",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    "@ripple",
    "@family-xrp",
    "@ethereum",
    "@family-evm",
  ],
});
