import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendValidAddressTest } from "@e2e/specs/send/send";

const transaction = new Transaction({
  accountToDebit: Account.XRP_1,
  accountToCredit: Account.XRP_2,
  amount: "2",
  memoTag: "noTag",
});
runSendValidAddressTest({
  transaction,
  tmsLinks: ["B2CQA-2719"],
  scenario: "without tag",
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ripple", "@family-xrp"],
});
