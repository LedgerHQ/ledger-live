import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { monitor, type LogEntry } from "@ledgerhq/coin-modules-monitoring/index";
import { getAccountShape } from "./bridge/synchronisation";

describe("Monitoring", () => {
  it("monitors", async () => {
    const currency = getCryptoCurrencyById("celo");
    const accounts = {
      pristine: { address: "0x64947cDB38d9d364eD5Ab78bfa23b29DE2ecdF7b" },
      average: { address: "0x709fcCB2141EddCd95A4d618e82a9E895792055d" },
      big: { address: "0xA5c453BC33FD9C5C798Ac24F666fa2B49E0a87fe" },
    };

    const logs = await monitor(currency, accounts, getAccountShape);

    expect(logs).toHaveLength(6);
    logs.forEach((log: LogEntry) => {
      expect(log.duration).toBeGreaterThan(0);
    });
  });
});
