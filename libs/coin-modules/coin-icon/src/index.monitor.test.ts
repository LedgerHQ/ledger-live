import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { monitor, type LogEntry } from "@ledgerhq/coin-modules-monitoring/index";
import { getAccountShape } from "./synchronization";
import { setCoinConfig } from "./config";

describe("Monitoring", () => {
  beforeAll(() => {
    setCoinConfig(() => ({
      status: { type: "active" },
      infra: {
        indexer: "https://tracker.icon.community/api/v1",
        indexer_testnet: "https://tracker.icon.community/api/v1",
        node_endpoint: "https://ctz.solidwallet.io/api/v3",
        node_testnet_endpoint: "https://sejong.net.solidwallet.io/api/v3",
        debug_endpoint: "https://tracker.icon.community/api/v1",
        debug_testnet_endpoint: "https://tracker.icon.community/api/v1",
      },
    }));
  });
  it("monitors", async () => {
    const currency = getCryptoCurrencyById("icon");
    const accounts = {
      pristine: { address: "hx4d932cbcffcc95fbac52fcb388fa20c868673a96" },
      average: { address: "hx2124c477a48c589f377aebfd8028bd4a8d7c0d2d" },
      big: { address: "hxd75467e3e4ce64e3424c747dfb71503017440433" },
    };

    const logs = await monitor(currency, accounts, getAccountShape);

    expect(logs).toHaveLength(6);
    logs.forEach((log: LogEntry) => {
      expect(log.duration).toBeGreaterThan(0);
    });
  });
});
