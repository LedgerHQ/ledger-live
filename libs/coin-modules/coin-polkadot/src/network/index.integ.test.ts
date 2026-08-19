import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import coinConfig from "../config";
import polkadotAPI from "./index";

const CURRENCY_CONFIGS = {
  polkadot: {
    currency: getCryptoCurrencyById("polkadot"),
    config: {
      status: { type: "active" as const },
      node: { url: "https://polkadot-rpc.publicnode.com" },
      sidecar: { url: "https://polkadot-mainnet-rest-api.coin.ledger.com/v1/rc" },
      indexer: { url: "https://polkadot.coin.ledger.com" },
      staking: { electionStatusThreshold: 25 },
    },
  },
  assethub_polkadot: {
    currency: getCryptoCurrencyById("assethub_polkadot"),
    config: {
      status: { type: "active" as const },
      sidecar: { url: "https://polkadot-mainnet-rest-api.coin.ledger.com/v1" },
      node: { url: "https://polkadot-asset-hub-fullnodes.api.live.ledger.com" },
      indexer: { url: "https://explorers.api.live.ledger.com/blockchain/dot_asset_hub" },
      staking: { electionStatusThreshold: 25 },
      hasBeenMigrated: true,
    },
  },
};

/**
 * Covers the on-demand staking path the react hooks use
 * (usePolkadotValidators / usePolkadotStakingProgress / usePolkadotMinimumBondBalance),
 * i.e. the LRU-cached entry points rather than the raw sidecar calls.
 */
describe.each(Object.entries(CURRENCY_CONFIGS))("network/index on-demand (%s)", (_, entry) => {
  const { currency, config } = entry;

  beforeAll(() => {
    coinConfig.setCoinConfig(() => config);
  });

  it("getValidators('all') returns validators", async () => {
    const validators = await polkadotAPI.getValidators("all", currency);
    expect(validators.length).toBeGreaterThan(0);
    expect(validators[0]).toMatchObject({
      address: expect.any(String),
      isElected: expect.any(Boolean),
    });
    expect(validators.some(v => v.isElected)).toBe(true);
  }, 60000);

  it("caches per currency, order-independently for stash lists", async () => {
    const [first, second] = await Promise.all([
      polkadotAPI.getValidators("all", currency),
      polkadotAPI.getValidators("all", currency),
    ]);
    expect(second).toBe(first);

    const stashes = [first[1].address, first[0].address];
    const byList = await polkadotAPI.getValidators(stashes, currency);
    const byReversedList = await polkadotAPI.getValidators([...stashes].reverse(), currency);
    expect(byReversedList).toBe(byList);
  }, 60000);

  it("getStakingProgress and getMinimumBondBalance resolve", async () => {
    const currencyConfig = coinConfig.getCoinConfig(currency.id);
    const staking = await polkadotAPI.getStakingProgress(currencyConfig, currency);
    expect(typeof staking.activeEra).toBe("number");
    expect(typeof staking.electionClosed).toBe("boolean");
    const minimumBondBalance = await polkadotAPI.getMinimumBondBalance(currencyConfig, currency);

    // Staking lives on Asset Hub since the migration, so the relay chain reports
    // neither an active era nor a minimum bond — only assethub_* carries them.
    if (currency.id.startsWith("assethub")) {
      expect(staking.activeEra).toBeGreaterThan(0);
      expect(minimumBondBalance.isGreaterThan(0)).toBe(true);
    }
  }, 60000);
});
