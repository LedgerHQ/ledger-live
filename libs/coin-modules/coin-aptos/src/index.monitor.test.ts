import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { monitor, type LogEntry } from "@ledgerhq/coin-modules-monitoring/index";
import { getAccountShape } from "./bridge/synchronisation";
import coinConfig from "./config";
import { Network } from "@aptos-labs/ts-sdk";

describe("Monitoring", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      status: {
        type: "active",
      },
      aptosSettings: {
        fullnode: "https://fullnode.mainnet.aptoslabs.com/v1",
        indexer: "https://indexer.mainnet.aptoslabs.com/v1/graphql",
        network: Network.MAINNET,
      },
    }));
  });

  it("monitors", async () => {
    const currency = getCryptoCurrencyById("aptos");
    const accounts = {
      pristine: { address: "0x404ccbd2acb6208effa69c100849feff040cec697d06f745152bdb3aa3a70614" },
      average: { address: "0x201cf09644cd5d88aa6db2d1670011325eea2c3198ddfd0c1aa549be0003bb24" },
      big: { address: "0xb8922507317d85197d70c2bc1afc949c759fd0a62c8841a4300d1e2b63649bf6" },
    };

    const logs = await monitor(currency, accounts, getAccountShape);

    expect(logs).toHaveLength(6);
    logs.forEach((log: LogEntry) => {
      expect(log.duration).toBeGreaterThan(0);
    });
  });
});
