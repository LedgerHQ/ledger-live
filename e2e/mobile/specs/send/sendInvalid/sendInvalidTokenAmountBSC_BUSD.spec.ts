import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSendInvalidTokenAmountTest } from "../send";

const transaction = new Transaction(
  TokenAccount.BSC_BUSD_1,
  TokenAccount.BSC_BUSD_2,
  "1",
  Fee.FAST,
);
runSendInvalidTokenAmountTest(
  transaction,
  new RegExp(
    /You need \d+\.\d+ BNB in your account to pay for transaction fees on the BNB Chain network\. .*/,
  ),
  ["B2CQA-2700"],
);
