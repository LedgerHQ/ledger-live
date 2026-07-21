import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendTest } from "../send";
import { FF_NEW_SEND_FLOW_ENABLED } from "../../../utils/featureFlagUtils";

runSendTest(
  new Transaction(Account.DOT_1, Account.DOT_2, "0.01"),
  ["B2CQA-2809"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@polkadot", "@family-polkadot"],
  { featureFlags: FF_NEW_SEND_FLOW_ENABLED, newSendFlow: true },
);
