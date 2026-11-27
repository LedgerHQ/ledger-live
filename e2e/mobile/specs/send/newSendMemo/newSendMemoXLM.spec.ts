import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runNewSendMemoTest } from "@e2e/specs/send/newSendFlow";
import { FF_NEW_SEND_FLOW_ENABLED } from "@e2e/utils/featureFlagUtils";

// Stellar rejects a new transaction while a previous one is still pending, so we broadcast a
// single transaction (with memo) rather than both a with- and without-memo transaction.
runNewSendMemoTest({
  transaction: new Transaction({
    accountToDebit: Account.XLM_1,
    accountToCredit: Account.XLM_2,
    amount: "0.01",
    memoTag: "memoText",
  }),
  tmsLinks: ["B2CQA-6038"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@stellar", "@family-stellar"],
  featureFlags: FF_NEW_SEND_FLOW_ENABLED,
  broadcastWithoutMemo: false,
  // Labels shown: No Memo, Memo Text, Memo ID, Memo Hash, Memo Return.
  memoTypeOptions: ["NO_MEMO", "MEMO_TEXT", "MEMO_ID", "MEMO_HASH", "MEMO_RETURN"],
});
