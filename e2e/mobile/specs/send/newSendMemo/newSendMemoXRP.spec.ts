import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runNewSendMemoTest } from "@e2e/specs/send/newSendFlow";
import { FF_NEW_SEND_FLOW_ENABLED } from "@e2e/utils/featureFlagUtils";

// XRP uses a numeric destination tag: assert numeric-only enforcement plus send with/without memo.
runNewSendMemoTest(
  new Transaction(Account.XRP_1, Account.XRP_2, "0.01", undefined, "123456"),
  ["B2CQA-6037"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ripple", "@family-xrp"],
  { featureFlags: FF_NEW_SEND_FLOW_ENABLED },
  { invalidMemoInput: "abcXYZ" },
);
