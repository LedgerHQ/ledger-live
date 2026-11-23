import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runNewSendFlowTest } from "@e2e/specs/send/newSendFlow";
import { FF_NEW_SEND_FLOW_ENABLED } from "@e2e/utils/featureFlagUtils";

runNewSendFlowTest({
  transaction: new Transaction(Account.DOT_1, Account.DOT_2, "0.01"),
  tmsLinks: ["B2CQA-2809"],
  tags: [
    "@NanoSP",
    "@LNS",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    "@polkadot",
    "@family-polkadot",
  ],
  featureFlags: FF_NEW_SEND_FLOW_ENABLED,
});
