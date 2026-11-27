import { runLedgerSyncDeleteBackupTest } from "@e2e/specs/ledgerSync/ledgerSync";

runLedgerSyncDeleteBackupTest({
  tmsLinks: ["B2CQA-2296"],
  tags: ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
});
