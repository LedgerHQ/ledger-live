import { runLedgerSyncActivationNoBackupTest } from "@e2e/specs/ledgerSync/ledgerSync";

runLedgerSyncActivationNoBackupTest(
  ["B2CQA-2293"],
  ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
);
