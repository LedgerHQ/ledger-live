import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendInvalidAddressTest } from "@e2e/specs/send/send";

const transaction = new Transaction(Account.XRP_1, Account.XRP_1, "1", undefined, "123456");
runSendInvalidAddressTest({
  transaction,
  expectedErrorMessage: "Destination and source accounts must not be the same.",
  tmsLinks: ["B2CQA-2712"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ripple", "@family-xrp"],
});
