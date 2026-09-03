import { knownStakingApps, stakingMethodOf, type StakingMethod } from "./stakingApps";
import { tokenBackedContracts } from "./stakingContracts";

/**
 * Drift guard for the staking-app allow list.
 *
 * The list gates emission, so it is held in code rather than fetched — a gate must not depend
 * on a network call. That leaves it free to go stale, which this closes: it reads the real Earn
 * API and fails when a provider appears that the allow list has never heard of.
 *
 * Hits the live service on purpose. A mocked response would only prove the fixture matches
 * itself, which is the failure this exists to catch.
 */
const PROVIDERS_URL = "https://earn.api.live.ledger.com/v0/currency/ethereum/providers";

type Provider = {
  liveAppId?: string;
  category?: string;
  active?: boolean;
};

// `protocol` is the API's word; `dedicated` is the one the business uses, and the one the API
// itself uses in `queryParams.focus`.
const METHOD_BY_CATEGORY: Record<string, StakingMethod> = {
  liquid: "liquid",
  pooling: "pooling",
  restaking: "restaking",
  protocol: "dedicated",
};

describe("the ETH staking-app allow list still matches the Earn API", () => {
  let providers: Provider[];

  beforeAll(async () => {
    const response = await fetch(PROVIDERS_URL, { headers: { accept: "application/json" } });
    expect(response.ok).toBe(true);
    providers = (await response.json()) as Provider[];
  }, 30_000);

  it("returns providers to check against", () => {
    expect(providers.length).toBeGreaterThan(0);
  });

  it("covers every active provider", () => {
    const known = new Set(knownStakingApps());
    const missing = [
      ...new Set(providers.filter(p => p.active && p.liveAppId).map(p => p.liveAppId as string)),
    ].filter(id => !known.has(id));

    expect(missing).toEqual([]);
  });

  /**
   * A live app serving two products cannot get its method from the manifest — Kiln offers a
   * pooled and a dedicated one behind `kiln-staking`, told apart only by a `queryParams.focus`
   * the bridge never sees. Those must report no method rather than a guessed one, and any
   * *new* such app has to be spotted here rather than silently mislabelled.
   */
  it("agrees with each provider's category, and reports nothing where the app is ambiguous", () => {
    const categoriesByApp = new Map<string, Set<string>>();
    for (const p of providers) {
      if (!p.active || !p.liveAppId || !p.category) continue;
      const seen = categoriesByApp.get(p.liveAppId) ?? new Set<string>();
      seen.add(p.category);
      categoriesByApp.set(p.liveAppId, seen);
    }

    const disagreements = [...categoriesByApp.entries()]
      .map(([liveAppId, categories]) => {
        const expected =
          categories.size === 1
            ? METHOD_BY_CATEGORY[[...categories][0]]
            : /* serves more than one product */ undefined;
        return {
          liveAppId,
          categories: [...categories],
          expected,
          actual: stakingMethodOf(liveAppId),
        };
      })
      .filter(row => row.expected !== row.actual);

    expect(disagreements).toEqual([]);
  });
});

/**
 * The receipt-token contracts are hardcoded, so CAL is where they are checked.
 *
 * Only the addresses that *are* tokens can be checked here. Stader deposits into a pool
 * manager that mints ETHx, and CAL returns nothing for a pool — asking it about one would fail
 * a guard that assumed every entry were a token.
 *
 * The address is the key, never the ticker: a `stETH` ticker query returns Lido's contract and
 * an unrelated `stakedETH`, so the ticker cannot identify a contract.
 */
const CAL_TOKENS = "https://global.api.prd.ledger.com/cal/v1/tokens";

describe("the receipt-token contracts still match CAL", () => {
  it.each(tokenBackedContracts())(
    "%s is still %s",
    async (address, ticker) => {
      const url = `${CAL_TOKENS}?output=ticker,contract_address&contract_address=${address}`;
      const response = await fetch(url, {
        headers: { "X-Ledger-Client-Version": "transaction-observability-integration-test" },
      });
      expect(response.ok).toBe(true);

      const tokens = (await response.json()) as Array<{ ticker?: string }>;
      expect(tokens.map(t => t.ticker)).toContain(ticker);
    },
    30_000,
  );
});
