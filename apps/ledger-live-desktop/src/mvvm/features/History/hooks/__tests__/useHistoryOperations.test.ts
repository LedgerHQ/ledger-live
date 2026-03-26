import { renderHook } from "tests/testSetup";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import { useHistoryOperations } from "../useHistoryOperations";

const bitcoinCurrency = getCryptoCurrencyById("bitcoin");
const ethereumCurrency = getCryptoCurrencyById("ethereum");

describe("useHistoryOperations", () => {
  it("returns an empty array when there are no accounts", () => {
    const { result } = renderHook(() => useHistoryOperations(), {
      initialState: { accounts: [], settings: INITIAL_STATE },
    });

    expect(result.current).toEqual([]);
  });

  it("collects, sorts, and shapes operations from multiple accounts", () => {
    const accounts = [
      genAccount("btc-1", { currency: bitcoinCurrency, operationsSize: 2 }),
      genAccount("eth-1", { currency: ethereumCurrency, operationsSize: 2 }),
    ];

    const { result } = renderHook(() => useHistoryOperations(), {
      initialState: { accounts, settings: INITIAL_STATE },
    });

    const items = result.current;

    expect(items.length).toBeGreaterThanOrEqual(4);

    for (let i = 1; i < items.length; i++) {
      expect(items[i - 1].date.getTime()).toBeGreaterThanOrEqual(items[i].date.getTime());
    }

    expect(items[0]).toMatchObject({
      id: expect.any(String),
      date: expect.any(Date),
      type: expect.any(String),
      address: expect.any(String),
    });
    expect(items[0].operation).toBeDefined();
    expect(items[0].account).toBeDefined();
    expect(items[0].currency).toBeDefined();
    expect(items[0].amount).toBeDefined();
  });
});
