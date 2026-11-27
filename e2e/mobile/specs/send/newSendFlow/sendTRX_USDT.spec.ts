import { TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runNewSendFlowTokenTest } from "@e2e/specs/send/newSendFlow";
import { FF_NEW_SEND_FLOW_ENABLED } from "@e2e/utils/featureFlagUtils";
import { setEnv } from "@shared/env";

// A broadcast TRC-20 transfer burns ~6.8 TRX of energy (QAA-1624).
setEnv("DISABLE_TRANSACTION_BROADCAST", true);

runNewSendFlowTokenTest({
  transaction: new Transaction({
    accountToDebit: TokenAccount.TRX_USDT,
    accountToCredit: TokenAccount.TRX_USDT_2,
    amount: "0.01",
  }),
  tmsLinks: ["B2CQA-6111"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@tron", "@family-tron"],
  featureFlags: { ...FF_NEW_SEND_FLOW_ENABLED },
});
