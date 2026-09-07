import { TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runNewSendFlowTokenTest } from "@e2e/specs/send/newSendFlow";
import { FF_NEW_SEND_FLOW_ENABLED } from "@e2e/utils/featureFlagUtils";

// wGNK uses 9 decimals where most ERC-20s use 18, so the amount deliberately fills all nine
// places: it cannot round-trip unless the currency magnitude is exactly 9.
runNewSendFlowTokenTest(
  new Transaction(TokenAccount.ETH_WGNK_1, TokenAccount.ETH_WGNK_3, "0.123456789"),
  ["B2CQA-6111"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
  { featureFlags: { ...FF_NEW_SEND_FLOW_ENABLED }, verifyAmountPrecision: true },
);
