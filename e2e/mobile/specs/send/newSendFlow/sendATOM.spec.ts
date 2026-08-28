import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runNewSendFlowTest } from "@e2e/specs/send/newSendFlow";
import { FF_NEW_SEND_FLOW_ENABLED } from "@e2e/utils/featureFlagUtils";

runNewSendFlowTest(
  new Transaction(Account.ATOM_1, Account.ATOM_2, "0.01", undefined, "noTag"),
  ["B2CQA-2814"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@cosmos", "@family-cosmos"],
  { featureFlags: { ...FF_NEW_SEND_FLOW_ENABLED } },
);
