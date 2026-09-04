import { TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runNewSendFlowTokenTest } from "@e2e/specs/send/newSendFlow";
import { FF_NEW_SEND_FLOW_ENABLED } from "@e2e/utils/featureFlagUtils";

runNewSendFlowTokenTest(
  new Transaction(TokenAccount.XLM_USDC, TokenAccount.XLM_USDC_3, "0.01", undefined, "noTag"),
  ["B2CQA-6111"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@stellar", "@family-stellar"],
  { featureFlags: { ...FF_NEW_SEND_FLOW_ENABLED } },
);
