import { setCoinConfig, type BitcoinConfigInfo } from "../config";

export const TEST_EXPLORER = "https://explorer.test";
/** The production explorer, for integration tests that reach it for real. */
export const LEDGER_EXPLORER = "https://explorers.api.live.ledger.com";

export const testCoinConfigInfo: BitcoinConfigInfo = {
  status: { type: "active" },
  infra: { EXPLORER: TEST_EXPLORER },
};

/** Wires the coin config the host app would supply, for every currency. */
export const setTestCoinConfig = (explorer: string = TEST_EXPLORER): void =>
  setCoinConfig(() => ({ info: { ...testCoinConfigInfo, infra: { EXPLORER: explorer } } }));
