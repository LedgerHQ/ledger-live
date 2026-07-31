import type { DatasetTest } from "@ledgerhq/types-live";
import type { Transaction } from "../types";

/**
 * Bot-spec dataset scaffolding (boilerplate pattern). Left empty: exercising
 * it for real requires recorded device APDU traces against the DMK Zcash
 * signer kit (PCZT device-signing transport), which this package does not
 * have a fixture for yet. The functional coverage for the four Zcash flows
 * lives in bridge/signOperation.test.ts and the copied adapter tests
 * (network/, logic/), which cover the same crafting/signing/finalizing logic
 * against a mocked signer + engine instead of a real device transport.
 */
export const dataset: DatasetTest<Transaction> = {
  implementations: ["mock"],
  currencies: {},
};
