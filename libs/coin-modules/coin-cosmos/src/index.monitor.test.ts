import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { monitor, type LogEntry } from "@ledgerhq/coin-modules-monitoring/index";
import { getAccountShape } from "./synchronisation";
import cryptoFactory from "./chain/chain";

describe("Monitoring", () => {
  beforeAll(() => {
    try {
      const cosmosInstance = cryptoFactory("cosmos");

      cosmosInstance.lcd = "https://cosmoshub4.coin.ledger.com";
      cosmosInstance.minGasPrice = 0.025;
      cosmosInstance.ledgerValidator = "cosmosvaloper10wljxpl03053h9690apmyeakly3ylhejrucvtm";
    } catch (error) {
      console.warn("Failed to setup Cosmos chain config:", error);
    }
  });

  it("monitors", async () => {
    const currency = getCryptoCurrencyById("cosmos");
    const accounts = {
      pristine: { address: "cosmos1cc3h49u9thwtvz4rlx9pf4kwycczx36q46rp59" },
      average: { address: "cosmos1gs72s636mzfnc0re2qrvupz0daytv4057y30g6" },
      big: { address: "cosmos18ejqp3d6yejcq3rxj4z6fsne63uj23cykw92pp" },
    };

    const logs = await monitor(currency, accounts, getAccountShape);

    expect(logs).toHaveLength(6);
    logs.forEach((log: LogEntry) => {
      expect(log.duration).toBeGreaterThan(0);
    });
  });
});
