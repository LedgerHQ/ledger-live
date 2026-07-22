import { TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runNewSendFlowTokenTest } from "../newSendFlow";
import { FF_NEW_SEND_FLOW_ENABLED } from "../../../utils/featureFlagUtils";

runNewSendFlowTokenTest(
  new Transaction(TokenAccount.TRX_USDT, TokenAccount.TRX_USDT_2, "0.01"),
  [],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@tron", "@family-tron"],
  { featureFlags: { ...FF_NEW_SEND_FLOW_ENABLED } },
);
