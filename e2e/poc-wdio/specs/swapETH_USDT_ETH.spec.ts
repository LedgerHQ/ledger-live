import { setEnv } from "@ledgerhq/live-env";

import { Swap } from "@ledgerhq/live-common/e2e/models/Swap";
import { Account, TokenAccount } from "@ledgerhq/live-common/e2e/enum/Account";
import { Fee } from "@ledgerhq/live-common/e2e/enum/Fee";

import { runSwapTest } from "./swap.test.ts";

const swapToTest = new Swap(TokenAccount.ETH_USDT_1, Account.ETH_1, "40", undefined, Fee.MEDIUM);

describe("Swap - Accepted (without tx broadcast)", async () => {
  before(async () => {
    setEnv("DISABLE_TRANSACTION_BROADCAST", true);
  });

  it(`${swapToTest.accountToDebit.currency.name} to ${swapToTest.accountToCredit.currency.name} (without broadcast)`, async () => {
    await runSwapTest(
      swapToTest,
      ["B2CQA-2752", "B2CQA-2048"],
      ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
    );
  });
});
