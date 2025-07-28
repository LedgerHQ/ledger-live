import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { monitor, type LogEntry } from "@ledgerhq/coin-modules-monitoring/index";
import { getAccountShape } from "./synchronisation";
import { setCoinConfig } from "./config";

describe("Monitoring", () => {
  beforeAll(() => {
    setCoinConfig(() => ({
      status: { type: "active" },
      infra: {
        API_NEAR_PRIVATE_NODE: "https://near.coin.ledger.com/node",
        API_NEAR_PUBLIC_NODE: "https://rpc.mainnet.near.org",
        API_NEAR_INDEXER: "https://near.coin.ledger.com/indexer",
      },
    }));
  });
  it("monitors", async () => {
    const currency = getCryptoCurrencyById("near");
    const accounts = {
      pristine: { address: "test-pristine.testnet" },
      average: { address: "nearkat.near" },
      big: { address: "relay.aurora" },
    };

    const logs = await monitor(currency, accounts, getAccountShape);

    expect(logs).toHaveLength(6);
    logs.forEach((log: LogEntry) => {
      expect(log.duration).toBeGreaterThan(0);
    });
  });
});
