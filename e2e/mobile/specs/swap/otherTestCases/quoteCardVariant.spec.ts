import { Account, TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runQuoteCardVariantTest } from "./swap.other";

const swapTestConfig = {
  fromAccount: Account.ETH_1,
  toAccount: TokenAccount.ETH_USDT_1,
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
};

runQuoteCardVariantTest(swapTestConfig.fromAccount, swapTestConfig.toAccount, swapTestConfig.tags);
