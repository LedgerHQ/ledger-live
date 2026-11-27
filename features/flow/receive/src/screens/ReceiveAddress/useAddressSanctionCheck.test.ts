import { act, renderHook, waitFor } from "@testing-library/react";
import { useAddressSanctionCheck } from "./useAddressSanctionCheck";

const ADDRESS = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";

const deferredCheck = () => {
  let answer: ((isSanctioned: boolean) => void) | undefined;
  const promise = new Promise<boolean>(resolve => {
    answer = resolve;
  });
  return { promise, answer: (isSanctioned: boolean) => answer?.(isSanctioned) };
};

describe("useAddressSanctionCheck", () => {
  it("lets every address through without a check", () => {
    const { result } = renderHook(() => useAddressSanctionCheck(ADDRESS, undefined));

    expect(result.current).toBe("clear");
  });

  it("checks the address before letting it through", async () => {
    const check = jest.fn(async () => false);
    const { result } = renderHook(() => useAddressSanctionCheck(ADDRESS, check));

    expect(result.current).toBe("checking");
    await waitFor(() => expect(result.current).toBe("clear"));
    expect(check).toHaveBeenCalledWith(ADDRESS);
  });

  it("tells a listed address apart", async () => {
    const check = jest.fn(async () => true);
    const { result } = renderHook(() => useAddressSanctionCheck(ADDRESS, check));

    await waitFor(() => expect(result.current).toBe("sanctioned"));
  });

  it("lets the address through when the check fails", async () => {
    const check = jest.fn(async () => Promise.reject(new Error("list unreachable")));
    const { result } = renderHook(() => useAddressSanctionCheck(ADDRESS, check));

    await waitFor(() => expect(result.current).toBe("clear"));
  });

  it("checks again when another address is shown", async () => {
    const check = jest.fn(async (address: string) => address === "u1shielded");
    const { result, rerender } = renderHook(
      ({ address }: { address: string }) => useAddressSanctionCheck(address, check),
      { initialProps: { address: ADDRESS } },
    );
    await waitFor(() => expect(result.current).toBe("clear"));

    rerender({ address: "u1shielded" });

    expect(result.current).toBe("checking");
    await waitFor(() => expect(result.current).toBe("sanctioned"));
  });

  it("checks again when the check changes", async () => {
    const firstCheck = jest.fn(async () => false);
    const secondCheck = jest.fn(async () => true);
    const { result, rerender } = renderHook(
      ({ check }: { check: (address: string) => Promise<boolean> }) =>
        useAddressSanctionCheck(ADDRESS, check),
      { initialProps: { check: firstCheck } },
    );
    await waitFor(() => expect(result.current).toBe("clear"));

    rerender({ check: secondCheck });

    expect(result.current).toBe("checking");
    await waitFor(() => expect(result.current).toBe("sanctioned"));
  });

  it("checks again when the same address is picked back", async () => {
    const secondCheck = deferredCheck();
    const check = jest
      .fn<Promise<boolean>, [string]>()
      .mockResolvedValueOnce(false)
      .mockReturnValueOnce(secondCheck.promise);
    const { result, rerender } = renderHook(
      ({ address }: { address: string | undefined }) => useAddressSanctionCheck(address, check),
      { initialProps: { address: ADDRESS as string | undefined } },
    );
    await waitFor(() => expect(result.current).toBe("clear"));

    rerender({ address: undefined });
    rerender({ address: ADDRESS });

    expect(result.current).toBe("checking");
    act(() => secondCheck.answer(true));
    await waitFor(() => expect(result.current).toBe("sanctioned"));
  });
});
