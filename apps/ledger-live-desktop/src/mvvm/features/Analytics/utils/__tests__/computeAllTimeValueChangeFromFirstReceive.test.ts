import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import {
  getCryptoCurrencyById,
  getFiatCurrencyByTicker,
} from "@ledgerhq/live-common/currencies/index";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { calculate } from "@ledgerhq/live-countervalues/logic";
import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import { computeAllTimeValueChangeFromFirstReceive } from "../computeAllTimeValueChangeFromFirstReceive";

jest.mock("@ledgerhq/live-countervalues/logic", () => ({
  calculate: jest.fn(),
}));

const mockCalculate = jest.mocked(calculate);

const btc = getCryptoCurrencyById("bitcoin");
const usd = getFiatCurrencyByTicker("USD");
const mockCvState = { data: {}, status: {}, cache: {} } as CounterValuesState;

function accountWithReceive(id: string, receiveDate: Date, receiveValue: number): Account {
  const account = genAccount(id, { currency: btc });
  account.operations = [
    {
      ...account.operations[0],
      id: `${id}-receive`,
      type: "IN",
      date: receiveDate,
      value: new BigNumber(receiveValue),
    },
  ];
  return account;
}

describe("computeAllTimeValueChangeFromFirstReceive", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null percentage when there are no receive operations", () => {
    const account = genAccount("empty", { currency: btc });
    account.operations = [];

    const result = computeAllTimeValueChangeFromFirstReceive([account], 1000, mockCvState, usd);

    expect(result).toEqual({ value: 0, percentage: null });
  });

  it("uses the earliest receive operation as the all-time baseline", () => {
    const earlier = accountWithReceive("btc-1", new Date("2020-01-01"), 1_000_000);
    const later = accountWithReceive("btc-2", new Date("2021-01-01"), 2_000_000);
    mockCalculate.mockReturnValue(100);

    const result = computeAllTimeValueChangeFromFirstReceive(
      [later, earlier],
      250,
      mockCvState,
      usd,
    );

    expect(mockCalculate).toHaveBeenCalledWith(
      mockCvState,
      expect.objectContaining({
        date: earlier.operations[0].date,
      }),
    );
    expect(result.value).toBe(150);
    expect(result.percentage).toBe(1.5);
  });

  it("returns a neutral value change when the first receive countervalue is unavailable", () => {
    const account = accountWithReceive("btc-1", new Date("2020-01-01"), 1_000_000);
    mockCalculate.mockReturnValue(undefined);

    const result = computeAllTimeValueChangeFromFirstReceive([account], 1000, mockCvState, usd);

    expect(result).toEqual({ value: 0, percentage: null });
  });

  it("returns zero percentage when the all-time delta is exactly zero", () => {
    const account = accountWithReceive("btc-1", new Date("2020-01-01"), 1_000_000);
    mockCalculate.mockReturnValue(1000);

    const result = computeAllTimeValueChangeFromFirstReceive([account], 1000, mockCvState, usd);

    expect(result).toEqual({ value: 0, percentage: 0 });
  });
});
