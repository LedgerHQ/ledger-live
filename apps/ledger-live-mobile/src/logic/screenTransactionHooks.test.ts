import { useRoute } from "@react-navigation/native";
import { renderHook } from "@tests/test-renderer";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { useTransactionChangeFromNavigation } from "./screenTransactionHooks";

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useRoute: jest.fn(),
}));

const mockUseRoute = jest.mocked(useRoute);
const transaction = { family: "generic", memo: "123" } as unknown as Transaction;

const routeWith = (params: { transaction?: Transaction }) =>
  mockUseRoute.mockReturnValue({
    key: "amount-key",
    name: "SendAmountCoin",
    params,
  } as never);

describe("useTransactionChangeFromNavigation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("adopts a transaction already present in the route params on mount", () => {
    const setTransaction = jest.fn();
    routeWith({ transaction });

    renderHook(() => useTransactionChangeFromNavigation(setTransaction));

    expect(setTransaction).toHaveBeenCalledTimes(1);
    expect(setTransaction).toHaveBeenCalledWith(transaction);
  });

  it("ignores route params carrying no transaction", () => {
    const setTransaction = jest.fn();
    routeWith({});

    renderHook(() => useTransactionChangeFromNavigation(setTransaction));

    expect(setTransaction).not.toHaveBeenCalled();
  });

  it("ignores an unchanged transaction when the setter identity changes", () => {
    const firstSetter = jest.fn();
    const secondSetter = jest.fn();
    routeWith({ transaction });

    let setTransaction = firstSetter;
    const { rerender } = renderHook(() => useTransactionChangeFromNavigation(setTransaction));
    setTransaction = secondSetter;
    rerender({});

    expect(firstSetter).toHaveBeenCalledTimes(1);
    expect(secondSetter).not.toHaveBeenCalled();
  });

  it("adopts a transaction mirrored onto the params after mount", () => {
    const setTransaction = jest.fn();
    routeWith({ transaction });
    const { rerender } = renderHook(() => useTransactionChangeFromNavigation(setTransaction));

    const editedTransaction = { ...transaction, memo: "456" } as Transaction;
    routeWith({ transaction: editedTransaction });
    rerender({});

    expect(setTransaction).toHaveBeenCalledTimes(2);
    expect(setTransaction).toHaveBeenLastCalledWith(editedTransaction);
  });
});
