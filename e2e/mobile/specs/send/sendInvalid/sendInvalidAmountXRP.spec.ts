import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendInvalidAmountTest } from "@e2e/specs/send/send";

const transaction = new Transaction({
  accountToDebit: Account.XRP_1,
  accountToCredit: Account.XRP_3,
  amount: "0.1",
  memoTag: "noTag",
});
runSendInvalidAmountTest({
  transaction,
  expectedErrorMessage: "Minimum of 1 XRP needed to activate recipient address",
  tmsLinks: ["B2CQA-2571"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ripple", "@family-xrp"],
});
