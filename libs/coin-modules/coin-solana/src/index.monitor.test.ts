import { GetAccountShape } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { getAccountShapeWithAPI } from "./synchronization";
import { SolanaAccount } from "./types";
import { getChainAPI } from "./network/chain";
import { endpointByCurrencyId } from "./utils";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import coinConfig from "./config";
import { monitor } from "@ledgerhq/coin-modules-monitoring/index";

describe("Monitoring", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      status: {
        type: "active",
      },
      token2022Enabled: true,
      queuedInterval: 100,
      legacyOCMSMaxVersion: "1.8.0",
    }));
  });

  it("monitors", async () => {
    const currency = getCryptoCurrencyById("solana");
    const getAccountShape: GetAccountShape<SolanaAccount> = async info => {
      const chainAPI = getChainAPI({
        endpoint: endpointByCurrencyId(info.currency.id),
      });
      return getAccountShapeWithAPI(info, chainAPI);
    };
    const accounts = {
      pristine: { address: "Hbac8tM3SMbua9ZBqPRbEJ2n3FtikRJc7wFmZzpqbtBv" },
      average: { address: "Hj69wRzkrFuf1Nby4yzPEFHdsmQdMoVYjvDKZSLjZFEp" },
      big: { address: "2ojv9BAiHUrvsm9gxDe7fJSzbNZSJcxZvf8dqmWGHG8S" },
    };

    const logs = await monitor(currency, accounts, getAccountShape);

    expect(logs).toHaveLength(6);
    logs.forEach(log => {
      expect(log.duration).toBeGreaterThan(0);
    });
  });
});
