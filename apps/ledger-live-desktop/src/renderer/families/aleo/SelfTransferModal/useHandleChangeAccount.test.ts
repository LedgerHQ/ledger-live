import { renderHook } from "tests/testSetup";
import { useHandleChangeAccount } from "./useHandleChangeAccount";
import { ALEO_ACCOUNT_2 } from "../__mocks__/account.mock";
import { makeAleoTransaction } from "../__mocks__/transaction.mock";

describe("useHandleChangeAccount", () => {
  const onChangeAccount = jest.fn();
  const updateTransaction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should do nothing when nextAcc is null", () => {
    const { result } = renderHook(() =>
      useHandleChangeAccount({ onChangeAccount, updateTransaction }),
    );

    result.current(null, null);

    expect(onChangeAccount).not.toHaveBeenCalled();
    expect(updateTransaction).not.toHaveBeenCalled();
  });

  it("should do nothing when nextAcc is undefined", () => {
    const { result } = renderHook(() =>
      useHandleChangeAccount({ onChangeAccount, updateTransaction }),
    );

    result.current(undefined, null);

    expect(onChangeAccount).not.toHaveBeenCalled();
    expect(updateTransaction).not.toHaveBeenCalled();
  });

  it("should call onChangeAccount with the next account", () => {
    const { result } = renderHook(() =>
      useHandleChangeAccount({ onChangeAccount, updateTransaction }),
    );

    result.current(ALEO_ACCOUNT_2, null);

    expect(onChangeAccount).toHaveBeenCalledWith(ALEO_ACCOUNT_2, null);
  });

  it("should call updateTransaction with a function that sets recipient to freshAddress of the main account", () => {
    const { result } = renderHook(() =>
      useHandleChangeAccount({ onChangeAccount, updateTransaction }),
    );

    result.current(ALEO_ACCOUNT_2, null);

    expect(updateTransaction).toHaveBeenCalledTimes(1);
    const updater = updateTransaction.mock.calls[0][0];
    const nextTx = updater(makeAleoTransaction({ recipient: "old-address" }));

    expect(nextTx.recipient).toBe(ALEO_ACCOUNT_2.freshAddress);
  });

  it("should preserve existing transaction fields when updating recipient", () => {
    const { result } = renderHook(() =>
      useHandleChangeAccount({ onChangeAccount, updateTransaction }),
    );

    result.current(ALEO_ACCOUNT_2, null);

    const updater = updateTransaction.mock.calls[0][0];
    const prevTx = makeAleoTransaction({ recipient: "old" });
    const nextTx = updater(prevTx);

    expect(nextTx).toMatchObject({ family: "aleo" });
    expect(nextTx.recipient).toBe(ALEO_ACCOUNT_2.freshAddress);
  });
});
