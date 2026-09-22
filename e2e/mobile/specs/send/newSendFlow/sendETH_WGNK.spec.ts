import { TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runNewSendFlowTokenTest } from "@e2e/specs/send/newSendFlow";
import { FF_NEW_SEND_FLOW_ENABLED } from "@e2e/utils/featureFlagUtils";

// wGNK uses 9 decimals where most ERC-20s use 18. Filling all nine places catches a magnitude
// below 9, which truncates the value. It does not catch a magnitude above 9 — 0.123456789
// round-trips at 18 too — so the magnitude ceiling is pinned on the desktop side, where the
// amount input can be probed one decimal deeper (see expectAmountMagnitude).
runNewSendFlowTokenTest(
  new Transaction(TokenAccount.ETH_WGNK_1, TokenAccount.ETH_WGNK_3, "0.123456789"),
  ["B2CQA-6111"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
  { featureFlags: { ...FF_NEW_SEND_FLOW_ENABLED }, verifyAmountPrecision: true },
);
