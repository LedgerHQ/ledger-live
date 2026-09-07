import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runNewSendMemoTest } from "@e2e/specs/send/newSendFlow";
import { FF_NEW_SEND_FLOW_ENABLED } from "@e2e/utils/featureFlagUtils";

// The Ledger Solana app does not surface the memo on the device review screen, so Speculos does
// not assert it; this test covers completion with and without a memo (skip).
runNewSendMemoTest(
  new Transaction(Account.SOL_1, Account.SOL_2, "0.01", undefined, "memo123"),
  ["B2CQA-6040"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@solana", "@family-solana"],
  { featureFlags: FF_NEW_SEND_FLOW_ENABLED },
);
