import { runLedgerSyncActivationRejectRetryTest } from "@e2e/specs/ledgerSync/ledgerSync";

runLedgerSyncActivationRejectRetryTest({
  tmsLinks: ["B2CQA-2294"],
  tags: ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
});
