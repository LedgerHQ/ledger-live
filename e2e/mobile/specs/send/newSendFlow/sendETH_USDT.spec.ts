import { TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runNewSendFlowTokenTest } from "../newSendFlow";
import { FF_NEW_SEND_FLOW_ENABLED } from "../../../utils/featureFlagUtils";

runNewSendFlowTokenTest(
  new Transaction(TokenAccount.ETH_USDT_1, TokenAccount.ETH_USDT_3, "0.01"),
  [],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
  { featureFlags: { ...FF_NEW_SEND_FLOW_ENABLED } },
);
