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
        url: "https://stellar.coin.ledger.com",
      },
    }));
  });

  it("monitors", async () => {
    const currency = getCryptoCurrencyById("stellar");
    const accounts = {
      pristine: { address: "GDO2OB4MWX4ZHDFGEHDTV6YB5TZY5MT2F5HEJ7UYR2JY3NTNNDOHA7AV" },
      average: { address: "GA6QQ7GWNAH7CW42IWV653UAERLQH3G2FDW76ZVL6KWJEZ37JTFH27ET" },
      big: { address: "GB6YM6S6NW5UDYQASFDFXHCIVLY7BEPRLYVUBXWME6K7YZKKA4VE2Q7C" },
    };

    const logs = await monitor(currency, accounts, getAccountShape);

    expect(logs).toHaveLength(6);
    logs.forEach((log: LogEntry) => {
      expect(log.duration).toBeGreaterThan(0);
    });
  });
});
