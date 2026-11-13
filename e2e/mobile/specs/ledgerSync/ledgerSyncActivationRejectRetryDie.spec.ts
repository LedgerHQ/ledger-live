import { runLedgerSyncActivationRejectRetryTest } from "@e2e/specs/ledgerSync/ledgerSync";

runLedgerSyncActivationRejectRetryTest(
  ["B2CQA-2294"],
  ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
);
