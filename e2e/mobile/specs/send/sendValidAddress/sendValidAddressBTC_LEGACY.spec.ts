import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendValidAddressTest } from "@e2e/specs/send/send";

const transaction = new Transaction(
  Account.BTC_LEGACY_1,
  Account.BTC_LEGACY_2,
  "0.00002",
  Fee.MEDIUM,
);
runSendValidAddressTest({
  transaction,
  tmsLinks: ["B2CQA-2722"],
  scenario: "legacy",
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@bitcoin", "@family-bitcoin"],
});
