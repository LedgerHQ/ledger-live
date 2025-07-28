import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { monitor, type LogEntry } from "@ledgerhq/coin-modules-monitoring/index";
import { getAccountShape } from "./bridge/synchronisation";

describe("Monitoring", () => {
  it("monitors", async () => {
    const currency = getCryptoCurrencyById("hedera");
    const accounts = {
      pristine: { address: "0.0.433" },
      average: { address: "0.0.1000" },
      big: { address: "0.0.652978" },
    };

    const logs = await monitor(currency, accounts, getAccountShape);

    expect(logs).toHaveLength(6);
    logs.forEach((log: LogEntry) => {
      expect(log.duration).toBeGreaterThan(0);
    });
  });
});
