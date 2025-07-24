import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { monitor } from "@ledgerhq/coin-modules-monitoring/index";
import { getAccountShape } from "./bridge/synchronization";
import { setCoinConfig } from "./config";

describe("Monitoring", () => {
  beforeAll(() => {
    setCoinConfig(() => ({
      info: {
        status: { type: "active" },
        gasTracker: {
          type: "ledger",
          explorerId: "eth",
        },
        node: {
          type: "ledger",
          explorerId: "eth",
        },
        explorer: {
          type: "ledger",
          explorerId: "eth",
        },
        showNfts: false,
      },
    }));
  });

  it("monitors", async () => {
    const currency = getCryptoCurrencyById("ethereum");
    const accounts = {
      pristine: { address: "0x6895Df5ed013c85B3D9D2446c227C9AfC3813551" },
      average: { address: "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3" },
      big: { address: "0xB8c77482e45F1F44dE1745F52C74426C631bDD52" },
    };

    const logs = await monitor(currency, accounts, getAccountShape);

    expect(logs).toHaveLength(6);
    logs.forEach(log => {
      expect(log.duration).toBeGreaterThan(0);
    });
  });
});
