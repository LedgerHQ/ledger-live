import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { monitor, type LogEntry } from "@ledgerhq/coin-modules-monitoring/index";
import { getAccountShape } from "./bridge/synchronization";
import coinConfig from "./config";

describe("Monitoring", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      status: {
        type: "active",
      },
      explorer: {
        url: "https://tron.coin.ledger.com",
      },
    }));
  });

  it("monitors", async () => {
    const currency = getCryptoCurrencyById("tron");
    const accounts = {
      pristine: { address: "TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH" },
      average: { address: "TKttnV3NSMA8AqZKpnjFAUFsWsAGdgT5YG" },
      big: { address: "TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7" },
    };

    const logs = await monitor(currency, accounts, getAccountShape);

    expect(logs).toHaveLength(6);
    logs.forEach((log: LogEntry) => {
      expect(log.duration).toBeGreaterThan(0);
    });
  });
});
