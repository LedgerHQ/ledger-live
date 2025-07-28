import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { monitor, type LogEntry } from "@ledgerhq/coin-modules-monitoring/index";
import { getAccountShape } from "./bridge/synchronisation";

describe("Monitoring", () => {
  it("monitors", async () => {
    const currency = getCryptoCurrencyById("vechain");
    const accounts = {
      pristine: { address: "0x5034aa590125b64023a0262112b98d72e3c8e40e" },
      average: { address: "0x23a93f95b5bafbf063cf63a129deca068de23288" },
      big: { address: "0xb0894ec7992e2ca4322dbd2eb99fa39448fe2d72" },
    };

    const logs = await monitor(currency, accounts, getAccountShape);

    expect(logs).toHaveLength(6);
    logs.forEach((log: LogEntry) => {
      expect(log.duration).toBeGreaterThan(0);
    });
  });
});
