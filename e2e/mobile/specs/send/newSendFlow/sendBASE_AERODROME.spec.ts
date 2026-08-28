import { TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runNewSendFlowTokenTest } from "@e2e/specs/send/newSendFlow";
import { FF_NEW_SEND_FLOW_ENABLED } from "@e2e/utils/featureFlagUtils";

runNewSendFlowTokenTest(
  new Transaction(TokenAccount.BASE_AERODROME_1, TokenAccount.BASE_AERODROME_2, "0.01"),
  ["B2CQA-6111"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@base", "@family-evm"],
  { featureFlags: { ...FF_NEW_SEND_FLOW_ENABLED } },
);
