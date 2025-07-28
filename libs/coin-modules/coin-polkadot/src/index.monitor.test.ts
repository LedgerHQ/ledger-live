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
      node: {
        url: "https://polkadot-rpc.publicnode.com",
      },
      sidecar: {
        url: "https://polkadot-sidecar.coin.ledger.com",
      },
      staking: {
        electionStatusThreshold: 25,
      },
      metadataShortener: {
        url: "https://polkadot-metadata-shortener.api.live.ledger.com/transaction/metadata",
      },
      metadataHash: {
        url: "https://polkadot-metadata-shortener.api.live.ledger.com/node/metadata/hash",
      },
    }));
  });
  it("monitors", async () => {
    const currency = getCryptoCurrencyById("polkadot");
    const accounts = {
      pristine: { address: "5HEDGMG7mYqh18Xs4BZpYZ3u7EPWUJ8hPDTJhq3cDZh1ztRW" },
      average: { address: "1zugcabYjgfQdMLC3cAzQ8tJZMo45tMnGpivpAzpxB4CZyK" },
      big: { address: "15K6nb2qhMorgiaavGZPPKCzcyrWFiWaSZM15UjqEn8C4yLn" },
    };

    const logs = await monitor(currency, accounts, getAccountShape);

    expect(logs).toHaveLength(6);
    logs.forEach((log: LogEntry) => {
      expect(log.duration).toBeGreaterThan(0);
    });
  });
});
