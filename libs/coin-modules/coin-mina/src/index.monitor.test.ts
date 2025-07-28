import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { monitor, type LogEntry } from "@ledgerhq/coin-modules-monitoring/index";
import { getAccountShape } from "./bridge/synchronisation";
import { setCoinConfig } from "./config";

describe("Monitoring", () => {
  beforeAll(() => {
    setCoinConfig(() => ({
      status: { type: "active" },
      infra: {
        API_MINA_ROSETTA_NODE: "https://mina.coin.ledger.com/node",
      },
    }));
  });
  it("monitors", async () => {
    const currency = getCryptoCurrencyById("mina");
    const accounts = {
      pristine: { address: "B62qoBXNhc6YqTa86zzniBjNTyshkM7NjGf1Z1uBJJXjSTdYK1qyKr6" },
      average: { address: "B62qja3UzWbWrJU6gHbdASQyVdMtxcGwPhxaWDiSrT6892ovCqsR6f6" },
      big: { address: "B62qoErNk7pK8BPtbx1eKoa4GURxvyB65hJNXmeRyk56TeB26zqosvw" },
    };

    const logs = await monitor(currency, accounts, getAccountShape);

    expect(logs).toHaveLength(6);
    logs.forEach((log: LogEntry) => {
      expect(log.duration).toBeGreaterThan(0);
    });
  });
});
