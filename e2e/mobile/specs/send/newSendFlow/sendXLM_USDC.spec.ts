import { TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runNewSendFlowTokenTest } from "../newSendFlow";
import { FF_NEW_SEND_FLOW_ENABLED } from "../../../utils/featureFlagUtils";

runNewSendFlowTokenTest(
  new Transaction(TokenAccount.XLM_USDC, TokenAccount.XLM_USDC_3, "0.01", undefined, "noTag"),
  [],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@stellar", "@family-stellar"],
  { featureFlags: { ...FF_NEW_SEND_FLOW_ENABLED } },
);
