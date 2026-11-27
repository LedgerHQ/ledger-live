import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runNewSendMemoTest } from "@e2e/specs/send/newSendFlow";
import { FF_NEW_SEND_FLOW_ENABLED } from "@e2e/utils/featureFlagUtils";

runNewSendMemoTest({
  transaction: new Transaction({
    accountToDebit: Account.ATOM_1,
    accountToCredit: Account.ATOM_2,
    amount: "0.01",
    memoTag: "memo123",
  }),
  tmsLinks: ["B2CQA-6039"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@cosmos", "@family-cosmos"],
  featureFlags: FF_NEW_SEND_FLOW_ENABLED,
});
