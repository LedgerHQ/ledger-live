import { BigNumber } from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import { BTC_ACCOUNT, ETH_ACCOUNT } from "LLD/features/__mocks__/accounts.mock";
import {
  type CalculateCountervalue,
  computeBalanceSortCountervalueByAccountId,
} from "../aggregateAccounts";

const calculateCountervalue: jest.Mock<ReturnType<CalculateCountervalue>> = jest.fn(
  (_from, value: BigNumber) => value.times(2),
);

beforeEach(() => {
  calculateCountervalue.mockReset();
  calculateCountervalue.mockImplementation((_from, value: BigNumber) => value.times(2));
});

function withBalance<T extends AccountLike>(account: T, balance: BigNumber): T {
  return { ...account, balance };
}

describe("computeBalanceSortCountervalueByAccountId", () => {
  it("returns per-account countervalues", () => {
    const a = withBalance(BTC_ACCOUNT, new BigNumber(100));
    const b = withBalance(ETH_ACCOUNT, new BigNumber(250));

    const map = computeBalanceSortCountervalueByAccountId([a, b], calculateCountervalue);

    expect(map.get(a.id)?.toString()).toBe("200");
    expect(map.get(b.id)?.toString()).toBe("500");
  });

  it("defaults to zero when countervalue is not available", () => {
    calculateCountervalue.mockReturnValueOnce(null);
    const account = withBalance(BTC_ACCOUNT, new BigNumber(100));
    const map = computeBalanceSortCountervalueByAccountId([account], calculateCountervalue);
    expect(map.get(account.id)?.toString()).toBe("0");
  });
});
