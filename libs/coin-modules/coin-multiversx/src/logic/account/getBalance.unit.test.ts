import { getBalance } from "./getBalance";
import type { MultiversXNetworkApi } from "../../network/api";

const ADDR = "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx";

function makeApi(overrides: Partial<MultiversXNetworkApi> = {}): MultiversXNetworkApi {
  return {
    getAccountDetails: jest
      .fn()
      .mockResolvedValue({ balance: "1000000000000000000", nonce: 5, isGuarded: false }),
    getAccountDelegations: jest.fn().mockResolvedValue([
      {
        address: ADDR,
        contract: "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l",
        userUnBondable: "0",
        userActiveStake: "500000000000000000",
        claimableRewards: "100000000000000000",
        userUndelegatedList: [],
      },
    ]),
    getESDTTokensForAddress: jest.fn().mockResolvedValue([
      { identifier: "USDC-c76f1f", name: "USD Coin", balance: "2000000" },
      { identifier: "WEGLD-bd4d79", name: "Wrapped EGLD", balance: "0" },
    ]),
    ...overrides,
  } as unknown as MultiversXNetworkApi;
}

describe("getBalance", () => {
  it("returns native balance including delegations", async () => {
    const api = makeApi();
    const balances = await getBalance(api, ADDR);

    expect(balances).toEqual(
      expect.arrayContaining([
        {
          value: BigInt("1600000000000000000"), // 1e18 + 500e15 + 100e15
          asset: { type: "native" },
          locked: BigInt("600000000000000000"), // staked portion
        },
      ]),
    );
  });

  it("returns ESDT balances with case-preserved identifiers", async () => {
    const api = makeApi();
    const balances = await getBalance(api, ADDR);

    expect(balances.filter(b => b.asset.type === "esdt")).toHaveLength(2);
    expect(balances).toEqual(
      expect.arrayContaining([
        { value: 2000000n, asset: { type: "esdt", assetReference: "USDC-c76f1f" } },
      ]),
    );
  });

  it("includes zero-balance ESDT tokens", async () => {
    const api = makeApi();
    const balances = await getBalance(api, ADDR);

    expect(balances).toEqual(
      expect.arrayContaining([
        { value: 0n, asset: { type: "esdt", assetReference: "WEGLD-bd4d79" } },
      ]),
    );
  });

  it("handles account with no delegations", async () => {
    const api = makeApi({ getAccountDelegations: jest.fn().mockResolvedValue([]) });
    const balances = await getBalance(api, ADDR);

    const native = balances.find(b => b.asset.type === "native");
    expect(native!.value).toBe(BigInt("1000000000000000000"));
    expect(native!.locked).toBeUndefined();
  });

  it("handles account with no ESDT tokens", async () => {
    const api = makeApi({ getESDTTokensForAddress: jest.fn().mockResolvedValue([]) });
    const balances = await getBalance(api, ADDR);

    expect(balances.filter(b => b.asset.type === "esdt")).toHaveLength(0);
  });
});
