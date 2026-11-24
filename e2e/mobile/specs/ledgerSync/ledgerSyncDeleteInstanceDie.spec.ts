import { runLedgerSyncDeleteInstanceTest } from "@e2e/specs/ledgerSync/ledgerSync";

runLedgerSyncDeleteInstanceTest({
  tmsLinks: ["B2CQA-2297"],
  tags: ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
  onDie: true,
});
