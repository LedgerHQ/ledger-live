import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { monitor, type LogEntry } from "@ledgerhq/coin-modules-monitoring/index";
import { getAccountShape } from "./synchronization";

describe("Monitoring", () => {
  it("monitors", async () => {
    const currency = getCryptoCurrencyById("algorand");
    const accounts = {
      pristine: { address: "JHCRLKUBKMRUUHJFYCBYOVQRTSRHSSL6P376LNDQJSVLM7IQI2EUH6S4ZU" },
      average: { address: "EZ6UMFSEAURIYP2E7KI4BUAERRASJM233XLFBO3ZOQYOQOHYL6FRPTYCEI" },
      big: { address: "KJOLZZ55JVCXTXDEVFSPUSKGP7SCQDEURMAMEBJEPXRLIQBQDTVD4NO7GQ" },
    };

    const logs = await monitor(currency, accounts, getAccountShape);

    expect(logs).toHaveLength(6);
    logs.forEach((log: LogEntry) => {
      expect(log.duration).toBeGreaterThan(0);
    });
  });
});
