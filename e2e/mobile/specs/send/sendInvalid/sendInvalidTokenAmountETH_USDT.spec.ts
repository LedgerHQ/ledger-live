import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSendInvalidTokenAmountTest } from "../send";

const transaction = new Transaction(
  TokenAccount.ETH_USDT_2,
  TokenAccount.ETH_USDT_1,
  "1",
  Fee.FAST,
);
runSendInvalidTokenAmountTest(
  transaction,
  new RegExp(
    /You need \d+\.\d+ ETH in your account to pay for transaction fees on the Ethereum network\. .*/,
  ),
  ["B2CQA-2701"],
);
