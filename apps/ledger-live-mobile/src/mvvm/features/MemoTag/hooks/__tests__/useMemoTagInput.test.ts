import { act, renderHook, waitFor, withFlagOverrides } from "@tests/test-renderer";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { TxPatch } from "../../types";
import { useMemoTagInput } from "../useMemoTagInput";

const overLimitPatch: TxPatch<Transaction> = tx => tx;
const fittingPatch: TxPatch<Transaction> = tx => tx;

describe("useMemoTagInput", () => {
  it("applies only the latest edit when the transaction changes between edits", async () => {
    const staleUpdate = jest.fn();
    const latestUpdate = jest.fn();
    let updateTransaction = staleUpdate;
    const { result, rerender } = renderHook(() => useMemoTagInput("cardano", updateTransaction), {
      overrideInitialState: withFlagOverrides({ llmMemoTag: { enabled: true } }),
    });

    act(() =>
      result.current?.handleChange({
        value: "x".repeat(65),
        patch: overLimitPatch,
        error: new Error("MemoTooLong"),
      }),
    );
    updateTransaction = latestUpdate;
    rerender({} as never);
    act(() => result.current?.handleChange({ value: "fits", patch: fittingPatch }));

    await waitFor(() => expect(latestUpdate).toHaveBeenCalledWith(fittingPatch));
    expect(latestUpdate).toHaveBeenCalledTimes(1);
    expect(staleUpdate).not.toHaveBeenCalled();
  });
});
