import type { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { getDebugRpcUrl, getRpcUrl } from "../../api/node";
import { type IconCoinConfig, setCoinConfig } from "../../config";

const configs: Record<string, IconCoinConfig> = {
  icon: {
    status: { type: "active" },
    infra: {
      ICON_INDEXER_ENDPOINT: "https://mainnet.test/api/v1",
      ICON_NODE_ENDPOINT: "https://mainnet.test/api/v3",
      ICON_DEBUG_ENDPOINT: "https://mainnet.test/api/v3d",
    },
  },
  icon_berlin_testnet: {
    status: { type: "active" },
    infra: {
      ICON_INDEXER_ENDPOINT: "https://testnet.test/api/v1",
      ICON_NODE_ENDPOINT: "https://testnet.test/api/v3",
      ICON_DEBUG_ENDPOINT: "https://testnet.test/api/v3d",
    },
  },
};

describe("ICON endpoints", () => {
  beforeAll(() => {
    setCoinConfig(currencyId => configs[currencyId ?? "icon"]);
  });

  it.each([
    ["icon", "https://mainnet.test/api/v3", "https://mainnet.test/api/v3d"],
    ["icon_berlin_testnet", "https://testnet.test/api/v3", "https://testnet.test/api/v3d"],
  ])("reads the %s node endpoints from its own coin config", (id, node, debug) => {
    const currency = { id } as CryptoCurrency;

    expect(getRpcUrl(currency)).toBe(node);
    expect(getDebugRpcUrl(currency)).toBe(debug);
  });
});
