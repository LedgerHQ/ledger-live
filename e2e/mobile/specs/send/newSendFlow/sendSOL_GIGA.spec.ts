import { TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runNewSendFlowTokenTest } from "@e2e/specs/send/newSendFlow";
import { FF_NEW_SEND_FLOW_ENABLED } from "@e2e/utils/featureFlagUtils";

runNewSendFlowTokenTest({
  transaction: new Transaction({
    accountToDebit: TokenAccount.SOL_GIGA_1,
    accountToCredit: TokenAccount.SOL_GIGA_2,
    amount: "0.01",
    memoTag: "noTag",
  }),
  tmsLinks: ["B2CQA-6111"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@solana", "@family-solana"],
  featureFlags: { ...FF_NEW_SEND_FLOW_ENABLED },
});
