import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runNewSendMemoTest } from "@e2e/specs/send/newSendFlow";
import { FF_NEW_SEND_FLOW_ENABLED } from "@e2e/utils/featureFlagUtils";

// XRP uses a numeric destination tag: assert numeric-only enforcement plus send with/without memo.
runNewSendMemoTest({
  transaction: new Transaction({
    accountToDebit: Account.XRP_1,
    accountToCredit: Account.XRP_2,
    amount: "0.01",
    memoTag: "123456",
  }),
  tmsLinks: ["B2CQA-6037"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ripple", "@family-xrp"],
  featureFlags: FF_NEW_SEND_FLOW_ENABLED,
  invalidMemoInput: "abcXYZ",
});
