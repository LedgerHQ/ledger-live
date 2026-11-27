import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendValidAddressTest } from "@e2e/specs/send/send";

const transaction = new Transaction({
  accountToDebit: Account.ATOM_1,
  accountToCredit: Account.ATOM_2,
  amount: "0.00001",
  memoTag: "123456",
});
runSendValidAddressTest({
  transaction,
  tmsLinks: ["B2CQA-2720"],
  scenario: "with tag",
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@cosmos", "@family-cosmos"],
});
