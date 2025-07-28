import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { monitor, type LogEntry } from "@ledgerhq/coin-modules-monitoring/index";
import { getAccountShape } from "./bridge/synchronisation";
import coinConfig from "./config";

describe("Monitoring", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      status: {
        type: "active",
      },
      node: {
        url: "https://fullnode.mainnet.sui.io:443",
      },
    }));
  });
  it("monitors", async () => {
    const currency = getCryptoCurrencyById("sui");
    const accounts = {
      pristine: { address: "0x285836edd88055191e2448ac81d00786dc33de570bcfdf96fed3e39747449fdc" },
      average: { address: "0x085f6362077282f861abe75151ba3ec6df1dbb82291369f9a06da135ac156c15" },
      big: { address: "0x15610fa7ee546b96cb580be4060fae1c4bb15eca87f9a0aa931512bad445fc76" },
    };

    const logs = await monitor(currency, accounts, getAccountShape);

    expect(logs).toHaveLength(6);
    logs.forEach((log: LogEntry) => {
      expect(log.duration).toBeGreaterThan(0);
    });
  });
});
