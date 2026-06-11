import BigNumber from "bignumber.js";
import { fetchTronAccount } from "../network";
import type { AccountTronAPI } from "../network/types";
import { computeBalance, computeBalanceBridge, getBalance } from "./getBalance";
import { getTronResources } from "./utils";

jest.mock("../network", () => ({
  fetchTronAccount: jest.fn(),
}));

jest.mock("./utils", () => {
  const actual = jest.requireActual<typeof import("./utils")>("./utils");
  return {
    ...actual,
    getTronResources: jest.fn(actual.getTronResources),
  };
});

const mockedFetchTronAccount = fetchTronAccount as jest.MockedFunction<typeof fetchTronAccount>;
const mockedGetTronResources = getTronResources as jest.MockedFunction<typeof getTronResources>;

const address = "41ae18eb0a9e067f8884058470ed187f44135d816d";

const baseAccount: AccountTronAPI = {
  address,
  balance: 1781772,
  trc20: [],
};

describe("computeBalance", () => {
  it("returns only the balance when no resources are frozen", () => {
    expect(computeBalance(baseAccount)).toEqual({
      value: 1781772n,
      asset: { type: "native" },
    });
  });

  it("returns 0 when balance is missing", () => {
    expect(computeBalance({ ...baseAccount, balance: undefined })).toEqual({
      value: 0n,
      asset: { type: "native" },
    });
  });

  it("adds frozen bandwidth and energy from frozenV2", () => {
    const account: AccountTronAPI = {
      ...baseAccount,
      frozenV2: [{ amount: 1_000_000 }, { type: "ENERGY", amount: 2_000_000 }],
    };
    expect(computeBalance(account)).toEqual({
      value: 4_781_772n,
      asset: { type: "native" },
    });
  });

  it("adds delegated frozen bandwidth and energy", () => {
    const account: AccountTronAPI = {
      ...baseAccount,
      delegated_frozenV2_balance_for_bandwidth: 500_000,
      account_resource: {
        delegated_frozenV2_balance_for_energy: 700_000,
      },
    };
    expect(computeBalance(account)).toEqual({
      value: 2_981_772n,
      asset: { type: "native" },
    });
  });

  it("adds unfrozen bandwidth and energy from unfrozenV2", () => {
    const account: AccountTronAPI = {
      ...baseAccount,
      unfrozenV2: [
        { unfreeze_amount: 100_000, unfreeze_expire_time: 0 },
        { type: "ENERGY", unfreeze_amount: 200_000, unfreeze_expire_time: 0 },
        { unfreeze_amount: 50_000, unfreeze_expire_time: 0 },
      ],
    };
    expect(computeBalance(account)).toEqual({
      value: 2_131_772n,
      asset: { type: "native" },
    });
  });

  it("adds legacy frozen bandwidth and energy", () => {
    const account: AccountTronAPI = {
      ...baseAccount,
      frozen: [{ frozen_balance: 300_000, expire_time: 0 }],
      account_resource: {
        frozen_balance_for_energy: { frozen_balance: 400_000, expire_time: 0 },
      },
    };
    expect(computeBalance(account)).toEqual({
      value: 2_481_772n,
      asset: { type: "native" },
    });
  });

  it("aggregates every kind of resource at once", () => {
    const account: AccountTronAPI = {
      ...baseAccount,
      balance: 1_000_000,
      frozenV2: [{ amount: 1_000_000 }, { type: "ENERGY", amount: 1_000_000 }],
      delegated_frozenV2_balance_for_bandwidth: 1_000_000,
      account_resource: {
        delegated_frozenV2_balance_for_energy: 1_000_000,
        frozen_balance_for_energy: { frozen_balance: 1_000_000, expire_time: 0 },
      },
      frozen: [{ frozen_balance: 1_000_000, expire_time: 0 }],
      unfrozenV2: [
        { unfreeze_amount: 1_000_000, unfreeze_expire_time: 0 },
        { type: "ENERGY", unfreeze_amount: 1_000_000, unfreeze_expire_time: 0 },
      ],
    };
    expect(computeBalance(account)).toEqual({
      value: 9_000_000n,
      asset: { type: "native" },
    });
  });

  it("falls back to zero when unFrozen energy and bandwidth are missing", () => {
    mockedGetTronResources.mockReturnValueOnce({
      frozen: { bandwidth: undefined, energy: undefined },
      unFrozen: { bandwidth: undefined, energy: undefined } as never,
      delegatedFrozen: { bandwidth: undefined, energy: undefined },
      legacyFrozen: { bandwidth: undefined, energy: undefined },
      tronPower: 0,
      lastWithdrawnRewardDate: undefined,
    });
    expect(computeBalance(baseAccount)).toEqual({
      value: 1_781_772n,
      asset: { type: "native" },
    });
  });
});

describe("computeBalanceBridge", () => {
  it("returns the balance as BigNumber when no resources are frozen", () => {
    expect(computeBalanceBridge(baseAccount)).toEqual(new BigNumber(1781772));
  });

  it("returns 0 when balance is missing", () => {
    expect(computeBalanceBridge({ ...baseAccount, balance: undefined })).toEqual(new BigNumber(0));
  });

  it("aggregates every kind of resource at once", () => {
    const account: AccountTronAPI = {
      ...baseAccount,
      balance: 1_000_000,
      frozenV2: [{ amount: 1_000_000 }, { type: "ENERGY", amount: 1_000_000 }],
      delegated_frozenV2_balance_for_bandwidth: 1_000_000,
      account_resource: {
        delegated_frozenV2_balance_for_energy: 1_000_000,
        frozen_balance_for_energy: { frozen_balance: 1_000_000, expire_time: 0 },
      },
      frozen: [{ frozen_balance: 1_000_000, expire_time: 0 }],
      unfrozenV2: [
        { unfreeze_amount: 1_000_000, unfreeze_expire_time: 0 },
        { type: "ENERGY", unfreeze_amount: 1_000_000, unfreeze_expire_time: 0 },
      ],
    };
    expect(computeBalanceBridge(account)).toEqual(new BigNumber(9_000_000));
  });

  it("falls back to zero when unFrozen energy and bandwidth are missing", () => {
    mockedGetTronResources.mockReturnValueOnce({
      frozen: { bandwidth: undefined, energy: undefined },
      unFrozen: { bandwidth: undefined, energy: undefined } as never,
      delegatedFrozen: { bandwidth: undefined, energy: undefined },
      legacyFrozen: { bandwidth: undefined, energy: undefined },
      tronPower: 0,
      lastWithdrawnRewardDate: undefined,
    });
    expect(computeBalanceBridge(baseAccount)).toEqual(new BigNumber(1_781_772));
  });
});

describe("getBalance", () => {
  beforeEach(() => {
    mockedFetchTronAccount.mockReset();
  });

  it("returns a zeroed native balance when the account is inactive", async () => {
    mockedFetchTronAccount.mockResolvedValueOnce([]);

    const balance = await getBalance(address);

    expect(balance).toEqual([{ asset: { type: "native" }, value: 0n }]);
    expect(mockedFetchTronAccount).toHaveBeenCalledWith(address);
  });

  it("returns native + trc10 + trc20 balances", async () => {
    mockedFetchTronAccount.mockResolvedValueOnce([
      {
        ...baseAccount,
        balance: 27_781_772,
        assetV2: [
          { key: "1002000", value: 26_888_000 },
          { key: "1004031", value: 9_856_699 },
        ],
        trc20: [
          { TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7: "46825830" },
          { TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t: "376" },
        ],
      },
    ]);

    const balance = await getBalance(address);

    expect(balance).toEqual([
      { asset: { type: "native" }, value: 27_781_772n },
      { asset: { type: "trc10", assetReference: "1002000" }, value: 26_888_000n },
      { asset: { type: "trc10", assetReference: "1004031" }, value: 9_856_699n },
      {
        asset: { type: "trc20", assetReference: "TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7" },
        value: 46_825_830n,
      },
      {
        asset: { type: "trc20", assetReference: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t" },
        value: 376n,
      },
    ]);
  });

  it("returns only the native balance when there is no assetV2 nor trc20", async () => {
    mockedFetchTronAccount.mockResolvedValueOnce([baseAccount]);

    const balance = await getBalance(address);

    expect(balance).toEqual([{ asset: { type: "native" }, value: 1_781_772n }]);
  });
});
