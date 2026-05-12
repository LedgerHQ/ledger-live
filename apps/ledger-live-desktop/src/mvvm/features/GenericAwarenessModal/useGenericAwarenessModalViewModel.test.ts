import { act, renderHook } from "tests/testSetup";
import type { AppDispatch } from "~/state-manager/configureStore";
import { closeGenericAwarenessModal, openGenericAwarenessModal } from "./genericAwarenessModal";
import useGenericAwarenessModalViewModel from "./useGenericAwarenessModalViewModel";

const dispatchThunk = (
  store: { dispatch: unknown },
  thunk:
    | ReturnType<typeof openGenericAwarenessModal>
    | ReturnType<typeof closeGenericAwarenessModal>,
) => {
  (store.dispatch as AppDispatch)(thunk);
};

describe("useGenericAwarenessModalViewModel", () => {
  it("should expose feature intro variant when opened without campaign id", () => {
    const { result, store } = renderHook(() => useGenericAwarenessModalViewModel());

    act(() => {
      dispatchThunk(store, openGenericAwarenessModal());
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.campaignId).toBeUndefined();
    expect(result.current.contentVariant).toBe("featureIntro");
  });

  it("should expose carousel variant when opened with even numeric campaign id", () => {
    const { result, store } = renderHook(() => useGenericAwarenessModalViewModel());

    act(() => {
      dispatchThunk(store, openGenericAwarenessModal({ campaignId: "2" }));
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.campaignId).toBe("2");
    expect(result.current.contentVariant).toBe("carousel");
  });

  it("should expose feature intro variant when opened with odd numeric campaign id", () => {
    const { result, store } = renderHook(() => useGenericAwarenessModalViewModel());

    act(() => {
      dispatchThunk(store, openGenericAwarenessModal({ campaignId: "3" }));
    });

    expect(result.current.contentVariant).toBe("featureIntro");
  });

  it("should keep carousel variant after close when campaign id is cleared", () => {
    const { result, store } = renderHook(() => useGenericAwarenessModalViewModel());

    act(() => {
      dispatchThunk(store, openGenericAwarenessModal({ campaignId: "2" }));
    });

    expect(result.current.contentVariant).toBe("carousel");

    act(() => {
      dispatchThunk(store, closeGenericAwarenessModal());
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.campaignId).toBeUndefined();
    expect(result.current.contentVariant).toBe("carousel");
  });
});
