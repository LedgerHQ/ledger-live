import type { PolkadotCoinConfig } from "@ledgerhq/coin-polkadot/config";
import { polkadotConfig } from "./config";

const defaultsOf = (currencyId: string) =>
  polkadotConfig[`config_currency_${currencyId}`].default as PolkadotCoinConfig;

const currencyIds = ["polkadot", "assethub_polkadot", "westend", "assethub_westend"];

describe("polkadot coin config defaults", () => {
  it.each(currencyIds)("points the %s endpoints at production hosts", currencyId => {
    const { sidecar, indexer, node } = defaultsOf(currencyId);

    [sidecar.url, indexer.url, node.url].forEach(url => {
      const { protocol, hostname } = new URL(url);
      expect(protocol).toBe("https:");
      expect(hostname).not.toMatch(/ledger-test\.com$/);
    });
  });

  it("carries the production endpoints of the polkadot relay chain", () => {
    const { sidecar, indexer, node } = defaultsOf("polkadot");

    expect([sidecar.url, indexer.url, node.url]).toEqual([
      "https://polkadot-mainnet-rest-api.coin.ledger.com/v1/rc",
      "https://polkadot.coin.ledger.com",
      "https://polkadot-fullnodes.api.live.ledger.com",
    ]);
  });

  it.each(currencyIds)("leaves the optional tuning of %s to the module defaults", currencyId => {
    const { staking, fees, validators } = defaultsOf(currencyId);

    expect([staking, fees, validators]).toEqual([undefined, undefined, undefined]);
  });

  it.each([
    ["polkadot", "inactive"],
    ["westend", "inactive"],
    ["assethub_polkadot", "active"],
    ["assethub_westend", "active"],
  ])("sets the staking feature of %s to %s", (currencyId, featureStatus) => {
    const { status } = defaultsOf(currencyId);

    expect(status).toEqual(
      expect.objectContaining({
        features: expect.arrayContaining([{ id: "staking_txs", status: featureStatus }]),
      }),
    );
  });

  it("flags the asset hub polkadot as migrated", () => {
    expect(defaultsOf("assethub_polkadot").hasBeenMigrated).toEqual(true);
  });
});
