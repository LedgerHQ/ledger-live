import { runLedgerSyncActivationBackupTest } from "@e2e/specs/ledgerSync/ledgerSync";

runLedgerSyncActivationBackupTest({
  tmsLinks: ["B2CQA-2294"],
  tags: ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
  onDie: true,
});
