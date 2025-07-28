import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { monitor, type LogEntry } from "@ledgerhq/coin-modules-monitoring/index";
import { getAccountShape } from "./common-logic/utils";

describe("Monitoring", () => {
  it("monitors", async () => {
    const currency = getCryptoCurrencyById("filecoin");
    const accounts = {
      pristine: { address: "f02901126" },
      average: { address: "f1dyqj5drgs4jjjkhddix2pptiwg2cjioyv4x4gli" },
      big: { address: "f1khdd2v7il7lxn4zjzzrqwceh466mq5k333ktu7q" },
    };

    const logs = await monitor(currency, accounts, getAccountShape);

    expect(logs).toHaveLength(6);
    logs.forEach((log: LogEntry) => {
      expect(log.duration).toBeGreaterThan(0);
    });
  });
});
