import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { monitor, type LogEntry } from "@ledgerhq/coin-modules-monitoring/index";
import { getAccountShape } from "./bridge/synchronization";
import coinConfig, { TezosCoinConfig } from "./config";

describe("Monitoring", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(
      () =>
        ({
          status: {
            type: "active",
          },
          node: {
            url: "https://tezos.coin.ledger.com",
          },
          explorer: {
            url: "https://xtz-tzkt-explorer.api.vault.ledger.com",
            maxTxQuery: 10000,
          },
        }) as TezosCoinConfig,
    );
  });

  it("monitors", async () => {
    const currency = getCryptoCurrencyById("tezos");

    const publicKeys = {
      pristine: "0082c6dcd37e14f83e852c8d3d21bc39289598f94cdd5800f6e4a9a8a5adfe3beb",
      average: "0019b730b7b55718272cd409ca3480ff07c848579cfa65c41a57d50398098c50b2",
      big: "007caac43b092bc041b15ca917c63ff7e721db93a16ace333c834fdcc1000884d2",
    };

    const accounts = {
      pristine: {
        address: "tz1PRejsXxpeHmhXcRpJqEHzR6vGDYK1xDga",
        rest: {
          publicKey: publicKeys.pristine,
        },
      },
      average: {
        address: "tz1PmPThcxFUEBh1tJrkZKwkaGrE5VjPs4CA",
        rest: {
          publicKey: publicKeys.average,
        },
      },
      big: {
        address: "tz1LGs8Mip54S3DYDghuxJvxTTDcvDYJVRyC",
        rest: {
          publicKey: publicKeys.big,
        },
      },
    };

    const logs = await monitor(currency, accounts, getAccountShape);

    expect(logs).toHaveLength(6);
    logs.forEach((log: LogEntry) => {
      expect(log.duration).toBeGreaterThan(0);
    });
  });
});
