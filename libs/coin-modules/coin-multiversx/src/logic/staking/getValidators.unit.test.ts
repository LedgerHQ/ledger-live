import { getValidators } from "./getValidators";
import type { MultiversXNetworkApi } from "../../network/api";
import type { MultiversXProvider } from "../../types";

function makeProvider(overrides: Partial<MultiversXProvider> = {}): MultiversXProvider {
  return {
    contract: "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l",
    owner: "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx",
    serviceFee: "0.1",
    maxDelegationCap: "0",
    initialOwnerFunds: "0",
    totalActiveStake: "1000000000000000000",
    totalUnstaked: "0",
    maxDelegateAmountAllowed: "0",
    apr: "10.5",
    explorerURL: "",
    address: "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l",
    aprValue: 10.5,
    automaticActivation: true,
    changeableServiceFee: true,
    checkCapOnRedelegate: false,
    createdNonce: 100,
    featured: false,
    numNodes: 5,
    numUsers: 1000,
    ownerBelowRequiredBalanceThreshold: false,
    unBondPeriod: 10,
    withDelegationCap: false,
    identity: {
      key: "test",
      name: "Test Validator",
      avatar: "https://example.com/avatar.png",
      description: "A test validator",
      twitter: "",
      url: "https://example.com",
    },
    ...overrides,
  };
}

function makeApi(providers: MultiversXProvider[]): MultiversXNetworkApi {
  return {
    getProviders: jest.fn().mockResolvedValue(providers),
  } as unknown as MultiversXNetworkApi;
}

describe("getValidators", () => {
  it("returns mapped validator list", async () => {
    const api = makeApi([makeProvider()]);
    const result = await getValidators(api);

    expect(result.items).toHaveLength(1);
    const v = result.items[0];
    expect(v.address).toBe("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l");
    expect(v.name).toBe("Test Validator");
    expect(v.apy).toBe(10.5);
    expect(v.balance).toBe(1000000000000000000n); // parsed from totalActiveStake, not hardcoded 0
  });

  it("falls back to 0 balance for an unparseable totalActiveStake", async () => {
    const api = makeApi([makeProvider({ totalActiveStake: "not-a-number" })]);
    const result = await getValidators(api);
    expect(result.items[0].balance).toBe(0n);
  });

  it("filters out disabled validators", async () => {
    const api = makeApi([
      makeProvider(),
      makeProvider({ contract: "erd1disabled", disabled: true }),
    ]);
    const result = await getValidators(api);
    expect(result.items).toHaveLength(1);
  });

  it("returns empty page when no providers", async () => {
    const api = makeApi([]);
    const result = await getValidators(api);
    expect(result.items).toHaveLength(0);
    expect(result.next).toBeUndefined();
  });
});
