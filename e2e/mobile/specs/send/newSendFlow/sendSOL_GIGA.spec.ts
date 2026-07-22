import { TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runNewSendFlowTokenTest } from "../newSendFlow";
import { FF_NEW_SEND_FLOW_ENABLED } from "../../../utils/featureFlagUtils";

runNewSendFlowTokenTest(
  new Transaction(TokenAccount.SOL_GIGA_1, TokenAccount.SOL_GIGA_2, "0.01", undefined, "noTag"),
  [],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@solana", "@family-solana"],
  { featureFlags: { ...FF_NEW_SEND_FLOW_ENABLED } },
);
