import { act, renderHook } from "@testing-library/react";
import { useAssetActivation } from "../useAssetActivation";

function setup() {
  const refresh = jest.fn().mockResolvedValue(undefined);
  const setIsAddressVisible = jest.fn();
  const hook = renderHook(
    ({ isAnyModalOpen }: { isAnyModalOpen: boolean }) =>
      useAssetActivation({ isAnyModalOpen, refresh, setIsAddressVisible }),
    { initialProps: { isAnyModalOpen: false } },
  );
  return { ...hook, refresh, setIsAddressVisible };
}

describe("useAssetActivation", () => {
  it("hides the receive dialog, opens the family flow, then reads the token again once it closes", () => {
    const { result, rerender, refresh, setIsAddressVisible } = setup();
    const openFlow = jest.fn();

    act(() => result.current.run(openFlow));
    expect(openFlow).toHaveBeenCalledTimes(1);
    expect(setIsAddressVisible).toHaveBeenLastCalledWith(false);

    rerender({ isAnyModalOpen: true });
    expect(refresh).not.toHaveBeenCalled();
    expect(result.current.hasReturned).toBe(false);

    rerender({ isAnyModalOpen: false });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(setIsAddressVisible).toHaveBeenLastCalledWith(true);
    expect(result.current.hasReturned).toBe(true);
  });

  it("does not read again before the family flow has opened", () => {
    const { result, refresh } = setup();

    act(() => result.current.run(jest.fn()));

    expect(refresh).not.toHaveBeenCalled();
    expect(result.current.hasReturned).toBe(false);
  });
});
