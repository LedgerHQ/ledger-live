/**
 * @jest-environment jsdom
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { createDBRecord, useDBRecord } from "./useDBRaw";

type Record = { a: string[]; b: string[] };

const initialState: Record = { a: [], b: [] };
const selectA = (state: Record) => state.a;
const selectB = (state: Record) => state.b;

function setup(stored: Record | undefined) {
  const getter = jest.fn().mockResolvedValue(stored);
  const setter = jest.fn();
  const record = createDBRecord<Record>({ initialState, getter, setter });
  const hookA = renderHook(() => useDBRecord(record, selectA));
  const hookB = renderHook(() => useDBRecord(record, selectB));
  return { getter, setter, hookA, hookB };
}

describe("createDBRecord", () => {
  it("keeps the changes of 2 hooks that write different fields", async () => {
    const { setter, hookA, hookB } = setup({ a: ["stored-a"], b: ["stored-b"] });
    await waitFor(() => expect(hookA.result.current[2]).toBe(true));

    act(() => hookA.result.current[1](state => ({ ...state, a: [...state.a, "new-a"] })));
    act(() => hookB.result.current[1](state => ({ ...state, b: [...state.b, "new-b"] })));

    expect(hookA.result.current[0]).toEqual(["stored-a", "new-a"]);
    expect(hookB.result.current[0]).toEqual(["stored-b", "new-b"]);
    expect(setter).toHaveBeenLastCalledWith({
      a: ["stored-a", "new-a"],
      b: ["stored-b", "new-b"],
    });
  });

  it("reads the record once for all hooks", async () => {
    const { getter, hookA } = setup(undefined);
    await waitFor(() => expect(hookA.result.current[2]).toBe(true));

    expect(getter).toHaveBeenCalledTimes(1);
  });

  it("does not write the initial state when the record is empty", async () => {
    const { setter, hookA } = setup(undefined);
    await waitFor(() => expect(hookA.result.current[2]).toBe(true));

    expect(hookA.result.current[0]).toEqual([]);
    expect(setter).not.toHaveBeenCalled();
  });

  it("applies a change made before the read on the stored state", async () => {
    let resolve!: (value: Record) => void;
    const getter = jest.fn(
      () =>
        new Promise<Record>(r => {
          resolve = r;
        }),
    );
    const setter = jest.fn();
    const record = createDBRecord<Record>({ initialState, getter, setter });
    const { result } = renderHook(() => useDBRecord(record, selectA));

    act(() => result.current[1](state => ({ ...state, a: [...state.a, "early"] })));
    expect(setter).not.toHaveBeenCalled();

    await act(async () => resolve({ a: ["stored-a"], b: ["stored-b"] }));

    expect(result.current[0]).toEqual(["stored-a", "early"]);
    expect(setter).toHaveBeenCalledTimes(1);
    expect(setter).toHaveBeenCalledWith({ a: ["stored-a", "early"], b: ["stored-b"] });
  });

  it("keeps updates and blocks writes when the read fails, then retries", async () => {
    const getter = jest
      .fn<Promise<Record | undefined>, []>()
      .mockRejectedValueOnce(new Error("read failed"))
      .mockResolvedValue({ a: ["stored-a"], b: ["stored-b"] });
    const setter = jest.fn();
    const record = createDBRecord<Record>({ initialState, getter, setter });
    const { result } = renderHook(() => useDBRecord(record, selectA));

    act(() => result.current[1](state => ({ ...state, a: [...state.a, "early"] })));
    await waitFor(() => expect(getter).toHaveBeenCalledTimes(1));
    await act(async () => {});

    expect(result.current[2]).toBe(false);
    expect(setter).not.toHaveBeenCalled();

    act(() => result.current[1](state => ({ ...state, a: [...state.a, "later"] })));
    await waitFor(() => expect(result.current[2]).toBe(true));

    expect(getter).toHaveBeenCalledTimes(2);
    expect(result.current[0]).toEqual(["stored-a", "early", "later"]);
    expect(setter).toHaveBeenCalledTimes(1);
    expect(setter).toHaveBeenCalledWith({ a: ["stored-a", "early", "later"], b: ["stored-b"] });
  });
});
