import { TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runNewSendFlowTokenTest } from "@e2e/specs/send/newSendFlow";
import { FF_NEW_SEND_FLOW_ENABLED } from "@e2e/utils/featureFlagUtils";

runNewSendFlowTokenTest({
  transaction: new Transaction({
    accountToDebit: TokenAccount.XLM_USDC,
    accountToCredit: TokenAccount.XLM_USDC_3,
    amount: "0.01",
    memoTag: "noTag",
  }),
  tmsLinks: ["B2CQA-6111"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@stellar", "@family-stellar"],
  featureFlags: { ...FF_NEW_SEND_FLOW_ENABLED },
});
