import { setCoinConfig } from "../config";
import { NEAR_BASE_URL_MOCKED } from "../network/node.mock";

/** Point every endpoint at the msw-mocked host. */
export const setMockCoinConfig = (): void =>
  setCoinConfig(() => ({
    status: { type: "active" },
    name: "NEAR",
    unit: { name: "NEAR", code: "NEAR", magnitude: 24 },
    infra: {
      API_NEAR_PRIVATE_NODE: NEAR_BASE_URL_MOCKED,
      API_NEAR_PUBLIC_NODE: NEAR_BASE_URL_MOCKED,
      API_NEAR_INDEXER: NEAR_BASE_URL_MOCKED,
      API_NEARBLOCKS_INDEXER: NEAR_BASE_URL_MOCKED,
    },
  }));
