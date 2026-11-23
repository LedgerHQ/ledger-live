import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendValidAddressTest } from "@e2e/specs/send/send";

const transaction = new Transaction(Account.ATOM_1, Account.ATOM_2, "0.00001", undefined, "123456");
runSendValidAddressTest({
  transaction,
  tmsLinks: ["B2CQA-2720"],
  scenario: "with tag",
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@cosmos", "@family-cosmos"],
});
