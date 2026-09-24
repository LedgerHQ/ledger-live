import { setCoinConfig, type ZcashConfigInfo } from "../config";

export const TEST_ZCASH_GRPC_URL = "https://zaino.test:443";
export const TEST_EXPLORER = "https://explorer.test";

export const testCoinConfigInfo: ZcashConfigInfo = {
  status: { type: "active" },
  infra: { EXPLORER: TEST_EXPLORER, ZCASH_GRPC_URL: TEST_ZCASH_GRPC_URL },
};

/** Wires the coin config the host app would supply, for every currency. */
export const setTestCoinConfig = (): void => setCoinConfig(() => ({ info: testCoinConfigInfo }));
