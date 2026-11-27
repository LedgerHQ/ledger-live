import { runLedgerSyncDeleteAccountTest } from "@e2e/specs/ledgerSync/ledgerSync";

runLedgerSyncDeleteAccountTest({
  tmsLinks: ["B2CQA-2300"],
  tags: ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
});
