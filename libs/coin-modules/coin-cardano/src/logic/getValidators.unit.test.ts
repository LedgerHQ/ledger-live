import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { APIGetPoolList, EpochInfo, StakePool } from "../api/api-types";
import { fetchEpochInfo } from "../api/getEpochInfo";
import { fetchPoolList } from "../api/getPools";
import { getValidators } from "./getValidators";

jest.mock("../api/getPools");
jest.mock("../api/getEpochInfo");

const mockFetchPoolList = jest.mocked(fetchPoolList);
const mockFetchEpochInfo = jest.mocked(fetchEpochInfo);

const currency = getCryptoCurrencyById("cardano");

// Epoch params the endpoint serves today (no reserves / active stake) → APY stays omitted.
const epochWithoutStakeData: EpochInfo = {
  number: 634,
  reserves: undefined,
  activeStake: undefined,
  params: { a0: 0.3, rho: 0.003, tau: 0.2 },
};

// Fully-populated epoch (reserves + active stake) → APY is computed.
const epochWithStakeData: EpochInfo = {
  ...epochWithoutStakeData,
  reserves: "14000000000000000",
  activeStake: "22000000000000000",
};

function pool(over: Partial<StakePool> = {}): StakePool {
  return {
    poolId: "pool1abc",
    name: "Stake Pool",
    ticker: "STK",
    website: "https://pool.example",
    margin: "3.00", // percent string, as the real /v1/pool/list returns (e.g. "6" = 6%)
    cost: "340000000",
    pledge: "100000000000",
    retiredEpoch: undefined,
    liveStake: "50000000000000",
    ...over,
  };
}

// fetchPoolList stub: serve `pools` in pages of `limit`, reporting the full count.
function paginate(pools: StakePool[], limit: number) {
  mockFetchPoolList.mockImplementation(async (_currency, _search, pageNo) => {
    const start = (pageNo - 1) * limit;
    return {
      pageNo,
      limit,
      count: pools.length,
      pools: pools.slice(start, start + limit),
    } as APIGetPoolList;
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  // Default: endpoint serves params but not reserves/active stake yet → no APY.
  mockFetchEpochInfo.mockResolvedValue(epochWithoutStakeData);
});

describe("getValidators", () => {
  it("pages through every pool and returns them in a single page", async () => {
    const pools = Array.from({ length: 250 }, (_, i) => pool({ poolId: `pool${i}` }));
    paginate(pools, 100);

    const { items, next } = await getValidators(currency);

    expect(mockFetchPoolList).toHaveBeenCalledTimes(3);
    expect(mockFetchPoolList.mock.calls.map(c => c[2])).toEqual([1, 2, 3]);
    expect(items).toHaveLength(250);
    expect(next).toBeUndefined();
  });

  it("returns a single page without extra calls when all pools fit in one fetch", async () => {
    paginate([pool({ poolId: "pool1" }), pool({ poolId: "pool2" })], 100);

    const { items } = await getValidators(currency);

    expect(mockFetchPoolList).toHaveBeenCalledTimes(1);
    expect(items).toHaveLength(2);
  });

  it("maps a pool to a validator", async () => {
    paginate([pool()], 100);

    const { items } = await getValidators(currency);

    expect(items[0]).toEqual({
      address: "pool1abc",
      name: "Stake Pool",
      url: "https://pool.example",
      balance: 50_000_000_000_000n,
      commissionRate: "3.00",
    });
    expect(items[0].apy).toBeUndefined();
  });

  it("falls back to ticker then poolId for the name, and omits url when absent", async () => {
    paginate(
      [
        pool({ poolId: "p1", name: undefined, ticker: "TICK", website: undefined }),
        pool({ poolId: "p2", name: undefined, ticker: undefined, website: undefined }),
      ],
      100,
    );

    const { items } = await getValidators(currency);

    expect(items[0].name).toBe("TICK");
    expect(items[1].name).toBe("p2");
    expect(items[0].url).toBeUndefined();
  });

  it("skips a pool with an unparseable liveStake instead of failing the whole list", async () => {
    paginate([pool({ poolId: "good" }), pool({ poolId: "bad", liveStake: "not-a-number" })], 100);

    const { items } = await getValidators(currency);

    expect(items).toHaveLength(1);
    expect(items[0].address).toBe("good");
  });

  it("includes retired pools (no filtering)", async () => {
    paginate([pool({ poolId: "retired", retiredEpoch: 400 })], 100);

    const { items } = await getValidators(currency);

    expect(items).toHaveLength(1);
    expect(items[0].address).toBe("retired");
  });

  it("sets apy once the epoch endpoint exposes reserves + active stake", async () => {
    mockFetchEpochInfo.mockResolvedValue(epochWithStakeData);
    paginate([pool({ liveStake: "30000000000000", pledge: "1000000000000", margin: "2.00" })], 100);

    const { items } = await getValidators(currency);

    expect(items[0].apy).toBeGreaterThan(0.03);
    expect(items[0].apy).toBeLessThan(0.12);
  });

  it("omits apy for a retired pool even when epoch data is available", async () => {
    mockFetchEpochInfo.mockResolvedValue(epochWithStakeData);
    paginate([pool({ retiredEpoch: 400 })], 100);

    const { items } = await getValidators(currency);

    expect(items[0].apy).toBeUndefined();
  });

  it("returns validators without apy when the epoch fetch fails", async () => {
    mockFetchEpochInfo.mockRejectedValue(new Error("epoch endpoint down"));
    paginate([pool()], 100);

    const { items } = await getValidators(currency);

    expect(items).toHaveLength(1);
    expect(items[0].apy).toBeUndefined();
  });
});
