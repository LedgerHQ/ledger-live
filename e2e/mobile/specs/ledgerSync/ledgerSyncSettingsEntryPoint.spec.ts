import { runLedgerSyncSettingsEntryPointTest } from "@e2e/specs/ledgerSync/ledgerSync";

runLedgerSyncSettingsEntryPointTest({
  tmsLinks: ["B2CQA-2292"],
  tags: ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
});
