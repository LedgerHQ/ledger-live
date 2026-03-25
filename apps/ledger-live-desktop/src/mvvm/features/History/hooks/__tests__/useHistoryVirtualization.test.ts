import { renderHook } from "tests/testSetup";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import type { Account } from "@ledgerhq/types-live";
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
    const headers = flatItems.filter(
      item => item.type === "day-header" || item.type === "section-header",
    );
    const operations = flatItems.filter(item => item.type === "operation");

    expect(headers.length).toBeGreaterThan(0);
    expect(operations.length).toBeGreaterThan(0);
  });

  it("inserts a pending section-header before day headers when pending operations exist", () => {
    const account = genAccount("btc-pending", { currency: bitcoinCurrency, operationsSize: 3 });
    const accountWithPending: Account = {
      ...account,
      pendingOperations: [
        { ...account.operations[0], id: "pending_op_1", hash: "pending_hash_1", blockHeight: null },
      ],
    };

    const { result } = renderHook(() => useComposedHook(), {
      initialState: { accounts: [accountWithPending], settings: INITIAL_STATE },
    });

    const types = result.current.flatItems.map(item => item.type);
    expect(types[0]).toBe("section-header");
    expect(types).toContain("day-header");
    expect(types).toContain("operation");
  });
});
