import { renderHook } from "tests/testSetup";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import { useHistoryOperations } from "../useHistoryOperations";
import { useHistoryTable } from "../useHistoryTable";
import { useHistoryVirtualization } from "../useHistoryVirtualization";

const bitcoinCurrency = getCryptoCurrencyById("bitcoin");

function useComposedHook() {
  const operations = useHistoryOperations();
  const table = useHistoryTable(operations);
  return useHistoryVirtualization(table);
}

describe("useHistoryVirtualization", () => {
  it("returns empty flatItems when there are no operations", () => {
    const { result } = renderHook(() => useComposedHook(), {
      initialState: { accounts: [], settings: INITIAL_STATE },
    });

    expect(result.current.flatItems).toEqual([]);
  });

  it("provides virtualizer refs and interleaves day headers with operation rows", () => {
    const accounts = [genAccount("btc-1", { currency: bitcoinCurrency, operationsSize: 5 })];

    const { result } = renderHook(() => useComposedHook(), {
      initialState: { accounts, settings: INITIAL_STATE },
    });

    expect(result.current.parentRef).toBeDefined();
    expect(result.current.rowVirtualizer).toBeDefined();

    const { flatItems } = result.current;
    const dayHeaders = flatItems.filter(item => item.type === "day-header");
    const operations = flatItems.filter(item => item.type === "operation");

    expect(dayHeaders.length).toBeGreaterThan(0);
    expect(operations.length).toBeGreaterThan(0);
    expect(flatItems[0].type).toBe("day-header");
  });
});
