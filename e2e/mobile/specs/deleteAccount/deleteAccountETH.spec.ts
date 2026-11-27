import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runDeleteAccountTest } from "@e2e/specs/deleteAccount/deleteAccount";

runDeleteAccountTest({
  account: Account.ETH_1,
  tmsLinks: ["B2CQA-2551"],
  tags: [
    "@NanoSP",
    "@LNS",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    "@smoke",
    "@ethereum",
    "@family-evm",
  ],
});
