import { runCreateRenameDeleteContactTest } from "specs/contacts/contacts";

// TODO: Unskip once the Ledger Sync activation prompt is automated — Contacts now opens behind a
// popup asking to turn Ledger Sync on, and the suite has no way past it.
const testConfig = {
  tmsLinks: ["B2CQA-6238"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

runCreateRenameDeleteContactTest(testConfig.tmsLinks, testConfig.tags);
