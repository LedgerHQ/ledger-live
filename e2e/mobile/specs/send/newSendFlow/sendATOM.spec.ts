import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runNewSendFlowTest } from "@e2e/specs/send/newSendFlow";
import { FF_NEW_SEND_FLOW_ENABLED } from "@e2e/utils/featureFlagUtils";

runNewSendFlowTest({
  transaction: new Transaction({
    accountToDebit: Account.ATOM_1,
    accountToCredit: Account.ATOM_2,
    amount: "0.01",
    memoTag: "noTag",
  }),
  tmsLinks: ["B2CQA-2814"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@cosmos", "@family-cosmos"],
  featureFlags: { ...FF_NEW_SEND_FLOW_ENABLED },
});
