import { act, renderHook } from "@tests/test-renderer";
import { useDynamicContentLogic } from "./useDynamicContentLogic";

describe("useDynamicContentLogic", () => {
  it("should not touch the store when the loading flag already has the requested value", async () => {
    const { result, store } = renderHook(() => useDynamicContentLogic());
    const onStoreChange = jest.fn();
    const unsubscribe = store.subscribe(onStoreChange);

    await act(async () => {
      result.current.setDynamicContentLoading(true);
    });
    unsubscribe();

    expect(onStoreChange).not.toHaveBeenCalled();
  });

  it("should set the loading flag when it changes", async () => {
    const { result, store } = renderHook(() => useDynamicContentLogic());

    await act(async () => {
      result.current.setDynamicContentLoading(false);
    });

    expect(store.getState().dynamicContent.isLoading).toBe(false);
  });
});
