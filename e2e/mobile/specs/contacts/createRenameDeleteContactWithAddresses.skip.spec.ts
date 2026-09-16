/**
 * Skipped until the Ethereum app the contacts device flows need reaches the Speculos catalog.
 * `@ledgerhq/device-contacts-kit` requires Ethereum 1.23.0 and, on nanoX, OS 2.8.0; the Provider 1
 * catalog `startSpeculos` reads serves Ethereum 1.22.4 on 2.7.1, so the register/rename intents are
 * rejected by their version guards. The connect step then falls back to reading device metadata,
 * which passes through the dashboard and ends the single-app Speculos container mid-flow.
 * Tracked in B2CQA-6239.
 */
import { runCreateRenameDeleteContactWithAddressesTest } from "@e2e/specs/contacts/contacts";

const testConfig = {
  tmsLinks: ["B2CQA-6239"],
  tags: [
    "@NanoSP",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    "@ethereum",
    "@family-evm",
  ],
};

runCreateRenameDeleteContactWithAddressesTest(
  testConfig.tmsLinks,
  testConfig.tags
);
