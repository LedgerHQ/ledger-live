import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendValidAddressTest } from "@e2e/specs/send/send";

const transaction = new Transaction(Account.XRP_1, Account.XRP_2, "1", undefined, "123456");
runSendValidAddressTest({
  transaction,
  tmsLinks: ["B2CQA-2718"],
  scenario: "with tag",
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ripple", "@family-xrp"],
});
