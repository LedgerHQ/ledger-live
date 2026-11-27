import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { encodeAddress, randomAsU8a } from "@polkadot/util-crypto";
import { polkadotDefaults } from "../config";
import polkadotAPI from "./index";
import { fetchStakingInfo } from "./node/stakingInfo";

const logger = jest.fn();

const CURRENCY_CONFIGS = {
  polkadot: {
    currency: getCryptoCurrencyById("polkadot"),
    config: polkadotDefaults.polkadot,
  },
  assethub_polkadot: {
    currency: getCryptoCurrencyById("assethub_polkadot"),
    config: polkadotDefaults.assethub_polkadot,
  },
};

/**
 * Covers the on-demand staking path the react hooks use
 * (usePolkadotValidators / usePolkadotStakingProgress / usePolkadotMinimumBondBalance),
 * i.e. the LRU-cached entry points rather than the raw sidecar calls.
 */
describe.each(Object.entries(CURRENCY_CONFIGS))("network/index on-demand (%s)", (_, entry) => {
  const { currency, config } = entry;

  it("getStakingProgress and getMinimumBondBalance resolve", async () => {
    const staking = await polkadotAPI.getStakingProgress(logger, config, currency.id);
    expect(typeof staking.activeEra).toBe("number");
    expect(typeof staking.electionClosed).toBe("boolean");
    const minimumBondBalance = await polkadotAPI.getMinimumBondBalance(config, currency.id);

    // Staking lives on Asset Hub since the migration, so the relay chain reports
    // neither an active era nor a minimum bond — only assethub_* carries them.
    if (currency.id.startsWith("assethub")) {
      expect(staking.activeEra).toBeGreaterThan(0);
      expect(minimumBondBalance.isGreaterThan(0)).toBe(true);
    }
  }, 60000);
});

describe("network/index account checks (assethub_polkadot)", () => {
  const { currency, config } = CURRENCY_CONFIGS.assethub_polkadot;
  const FUNDED_ADDRESS = "15oodc5d8DWJodZhTD6qsxxSQRYWhdkWCrwqNHajDirXRrAD";
  const BONDED_ADDRESS = "12YA86tRQhHgwU3SSj56aesUKB7GKvdnZTTTXRop4vd3YgDV";
  const unusedAddress = encodeAddress(randomAsU8a(32), 0);

  it("reports an address that never received funds as a new account", async () => {
    expect(await polkadotAPI.isNewAccount(config, unusedAddress, currency.id)).toBe(true);
  }, 60000);

  it("reports an address that holds funds as an existing account", async () => {
    expect(await polkadotAPI.isNewAccount(config, FUNDED_ADDRESS, currency.id)).toBe(false);
  }, 60000);

  it("reports an address that never bonded as not being a controller", async () => {
    expect(await polkadotAPI.isControllerAddress(config, unusedAddress, currency.id)).toBe(false);
  }, 60000);

  it("returns the addresses that are not validators", async () => {
    expect(
      await polkadotAPI.verifyValidatorAddresses(config, [unusedAddress], currency.id, []),
    ).toEqual([unusedAddress]);
  }, 60000);

  it("rejects the staking info of an address that never bonded", async () => {
    await expect(fetchStakingInfo(config, unusedAddress, currency.id)).rejects.toThrow(
      "is not a stash address",
    );
  }, 60000);

  it("resolves the staking info of BONDED_ADDRESS, an address that is bonded on chain", async () => {
    const stakingInfo = await fetchStakingInfo(config, BONDED_ADDRESS, currency.id);

    expect(stakingInfo).toEqual({
      staking: { unlocking: expect.any(Array) },
      numSlashingSpans: expect.any(Number),
    });
    expect(stakingInfo.numSlashingSpans).toBeGreaterThanOrEqual(0);
  }, 60000);
});

describe("network/index on-demand validators (assethub_polkadot)", () => {
  const { currency, config } = CURRENCY_CONFIGS.assethub_polkadot;

  it("getValidators('all') returns validators", async () => {
    const validators = await polkadotAPI.getValidators(config, "all", currency.id);
    expect(validators.length).toBeGreaterThan(0);
    expect(validators[0]).toMatchObject({
      address: expect.any(String),
      isElected: expect.any(Boolean),
    });
    expect(validators.some(v => v.isElected)).toBe(true);
  }, 60000);

  it("caches per currency, order-independently for stash lists", async () => {
    const [first, second] = await Promise.all([
      polkadotAPI.getValidators(config, "all", currency.id),
      polkadotAPI.getValidators(config, "all", currency.id),
    ]);
    expect(second).toBe(first);

    const stashes = [first[1].address, first[0].address];
    const byList = await polkadotAPI.getValidators(config, stashes, currency.id);
    const byReversedList = await polkadotAPI.getValidators(
      config,
      [...stashes].reverse(),
      currency.id,
    );
    expect(byReversedList).toBe(byList);
  }, 60000);
});
