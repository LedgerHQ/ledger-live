import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { monitor, type LogEntry } from "@ledgerhq/coin-modules-monitoring/index";
import { getAccountShape } from "./synchronisation";

describe("Monitoring", () => {
  it("monitors", async () => {
    const currency = getCryptoCurrencyById("elrond");
    const accounts = {
      pristine: { address: "erd1s4pulht4wn96swcwel64624l40h5lyxfnl9cejwy27kvwvqayuvq2y7klj" },
      average: { address: "erd1trwn89w64n88xhl76y8rfzj4r59h2fc8u03mg0tzjh8r3lmwq0lsa3q0yk" },
      big: { address: "erd17l22xekj5lvfulatz20xr0llxky6c8zr923r95qg3pfx668m862skjdveh" },
    };

    const logs = await monitor(currency, accounts, getAccountShape);

    expect(logs).toHaveLength(6);
    logs.forEach((log: LogEntry) => {
      expect(log.duration).toBeGreaterThan(0);
    });
  });
});
