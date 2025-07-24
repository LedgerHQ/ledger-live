import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { monitor } from "@ledgerhq/coin-modules-monitoring/index";
import { setCoinConfig } from "./config";
import { makeGetAccountShape } from "./synchronisation";

describe("Monitoring", () => {
  beforeAll(() => {
    setCoinConfig(() => ({
      info: {
        status: { type: "active" },
      },
    }));
  });

  it("monitors", async () => {
    const currency = getCryptoCurrencyById("bitcoin");
    const getAccountShape = makeGetAccountShape(() => Promise.resolve() as any);
    const accounts = {
      pristine: {
        address: "",
        derivationMode: "native_segwit",
        initialAccount: {
          id: "js:2:bitcoin:xpub6BvBDx9oswQpgmpwbMi7BMU78NNYe6b9ncdmmVA1LBXirjmHxzM8zgChZiQcetvk7JZJ5AAqgYgnupnPfvenXFULotGQxQFz36P2T8XZzsE:native_segwit",
        },
      },
      average: {
        address: "",
        derivationMode: "native_segwit",
        initialAccount: {
          id: "js:2:bitcoin:xpub6CCc6taSdhLfwHhSyrkHh1fc2CgvDAbezeM5wunWfs7tCH26ysNK8nvoyAzBTBM38NbYSFehwwnZRAYHkBB9JM3gC8eJ2n5CNJgjX7Srdse:native_segwit",
        },
      },
    } as const;

    const logs = await monitor(currency, accounts, getAccountShape);

    expect(logs).toHaveLength(4);
    logs.forEach(log => {
      expect(log.duration).toBeGreaterThan(0);
    });
  });
});
