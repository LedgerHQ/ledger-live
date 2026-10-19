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

runReceiveBlockedOnLNSTest(
  Account.ZEC_1,
  ["B2CQA-6605"],
  ["@LNS", "@zcash", "@family-bitcoin"],
  Team.BST,
);
