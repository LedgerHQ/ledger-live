import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSwapTest } from "@e2e/specs/swap/swap";

runSwapTest({
  accountToDebit: TokenAccount.ETH_USDT_1,
  accountToCredit: Account.ETH_1,
  tmsLinks: ["B2CQA-2752", "B2CQA-2048"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
});
