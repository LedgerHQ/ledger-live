import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import {
  runReceiveBlockedOnLNSTest,
  runVerifyAddressTest,
} from "@e2e/specs/verifyAddress/verifyAddress";

runVerifyAddressTest(
  Account.ZEC_1,
  ["B2CQA-6605"],
  ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@zcash", "@family-bitcoin"],
  Team.BST,
);

runReceiveBlockedOnLNSTest({
  account: Account.ZEC_1,
  tmsLinks: ["B2CQA-6605"],
  tags: ["@LNS", "@zcash", "@family-bitcoin"],
  teamOwner: Team.BST,
});
