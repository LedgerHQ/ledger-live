import { runLedgerSyncActivationNoBackupTest } from "@e2e/specs/ledgerSync/ledgerSync";

runLedgerSyncActivationNoBackupTest({
  tmsLinks: ["B2CQA-2293"],
  tags: ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
});
