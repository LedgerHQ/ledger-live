import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { monitor, type LogEntry } from "@ledgerhq/coin-modules-monitoring/index";
import { getAccountShape } from "./synchronisation";
import { setCoinConfig } from "./config";
import { API_TON_ENDPOINT } from "./__tests__/fixtures/api.fixtures";

describe("Monitoring", () => {
  beforeAll(() => {
    setCoinConfig(() => ({
      status: {
        type: "active",
      },
      infra: {
        API_TON_ENDPOINT,
        KNOWN_JETTONS: [],
      },
    }));
  });

  it("monitors", async () => {
    const currency = getCryptoCurrencyById("ton");

    const accounts = {
      pristine: {
        address: "EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t",
        rest: {
          publicKey: "000000000000000000000000000000000000000000000000000000000000000000",
        },
      },
      average: {
        address: "EQCkR1cGmnsE45N4K0otPl5EnxnRakmGqeJUNua5fkWhales",
        rest: {
          publicKey: "111111111111111111111111111111111111111111111111111111111111111111",
        },
      },
      big: {
        address: "EQBYtJtQzU3MKOfVcxVynHx0qNBU8q8mCeJkS8jqJqJqJqJq",
        rest: {
          publicKey: "222222222222222222222222222222222222222222222222222222222222222222",
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
