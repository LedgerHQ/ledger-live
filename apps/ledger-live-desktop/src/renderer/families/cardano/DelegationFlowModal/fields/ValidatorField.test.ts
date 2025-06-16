import * as StakingFunctions from "@ledgerhq/live-common/families/cardano/staking";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import {
  concatUserAndLedgerPoolIds,
  fetchAndSortPools,
  putUserPoolAtFirstPositionInPools,
} from "./ValidatorField";
import { StakePool } from "@ledgerhq/live-common/families/cardano/staking";

function stackPool(id: string): StakePool {
  return { poolId: id } as StakePool;
}

describe("Testing ValidatorField functions", () => {
  it.each([[[]], [["1"]], [["1", "2"]]])(
    "should return only Ledger pool ids when user has not used any pool previously",
    (ledgerPoolIds: string[]) => {
      const ids = concatUserAndLedgerPoolIds(undefined, ledgerPoolIds);
      expect(ids.length).toEqual(ledgerPoolIds.length);
      ledgerPoolIds.forEach(id => expect(ids).toContain(id));
    },
  );

  it.each([[[]], [["1"]], [["1", "2"]]])(
    "should return user last used pool and Ledger pool ids",
    (ledgerPoolIds: string[]) => {
      const ids = concatUserAndLedgerPoolIds("3", ledgerPoolIds);
      expect(ids.length).toEqual(ledgerPoolIds.length + 1);
      expect(ids).toContain("3");
      ledgerPoolIds.forEach(id => expect(ids).toContain(id));
    },
  );

  it.each([
    [[stackPool("1")]],
    [[stackPool("1"), stackPool("2")]],
    [[stackPool("2"), stackPool("1")]],
  ])(
    "should always put user last used pool at the first index when user pool exists",
    (pools: StakePool[]) => {
      const userLastUsedPool = "1";

      const result = putUserPoolAtFirstPositionInPools(pools, userLastUsedPool);
      expect(result.length).toEqual(pools.length);
      expect(result[0].poolId).toEqual(userLastUsedPool);
      pools.forEach(pool =>
        expect(result.some(sortedPool => sortedPool.poolId === pool.poolId)).toEqual(true),
      );
    },
  );

  it.each([
    [[]],
    [[stackPool("1")]],
    [[stackPool("1"), stackPool("2")]],
    [[stackPool("2"), stackPool("1")]],
  ])(
    "should return the same pools when user last used pool was not found",
    (pools: StakePool[]) => {
      const userLastUsedPool = "3";
      const result = putUserPoolAtFirstPositionInPools(pools, userLastUsedPool);
      expect(result.length).toEqual(pools.length);
      expect(result.every(resultPool => resultPool.poolId !== userLastUsedPool)).toEqual(true);
      expect(
        pools.every(pool => result.some(resultPool => resultPool.poolId === pool.poolId)),
      ).toEqual(true);
    },
  );

  it("should fetch and sort pools correctly for an user", async () => {
    const userLastUsedPool = "1";
    const pools = [stackPool("2"), stackPool("3"), stackPool("1")];
    jest
      .spyOn(StakingFunctions, "fetchPoolDetails")
      .mockReturnValue(Promise.resolve({ pools: pools }));

    const result = await fetchAndSortPools({} as CryptoCurrency, ["1", "2", "3"], userLastUsedPool);
    expect(result).toHaveLength(3);
    expect(result[0].poolId).toEqual(userLastUsedPool);
    expect(
      result.every(resultPool => pools.some(pool => pool.poolId === resultPool.poolId)),
    ).toEqual(true);
  });
});
