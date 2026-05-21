import { act } from "@testing-library/react";
import { GenericAwarenessModalLayout } from "@ledgerhq/live-common/genericAwarenessModal";
import type { AppDispatch } from "~/state-manager/configureStore";
import { setGenericAwarenessModalContentCards } from "~/renderer/reducers/genericAwarenessModalSlice";
import {
  closeGenericAwarenessModalDialog,
  openGenericAwarenessModalDialog,
} from "../../genericAwarenessModalDialog";
import {
  evenCampaignCarouselCard,
  genericAwarenessModalTestContentCards,
} from "../../__tests__/fixtures";
import useGenericAwarenessModalViewModel from "../useGenericAwarenessModalViewModel";
import { renderHookWithStore } from "./utils/renderHookWithStore";

const dispatchThunk = (
  store: { dispatch: unknown },
  thunk:
    | ReturnType<typeof openGenericAwarenessModalDialog>
    | ReturnType<typeof closeGenericAwarenessModalDialog>,
) => {
  (store.dispatch as AppDispatch)(thunk);
};

describe("useGenericAwarenessModalViewModel", () => {
  it("should be closed initially", () => {
    const { result } = renderHookWithStore(() => useGenericAwarenessModalViewModel());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.contentCard).toBeUndefined();
  });

  it("should expose content card from store when opened with matching campaign id", () => {
    const { result, store } = renderHookWithStore(() => useGenericAwarenessModalViewModel());

    act(() => {
      store.dispatch(setGenericAwarenessModalContentCards(genericAwarenessModalTestContentCards));
      dispatchThunk(store, openGenericAwarenessModalDialog({ campaignId: "2" }));
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.contentCard).toEqual(evenCampaignCarouselCard);
  });

  it("should keep last content card after close", () => {
    const { result, store } = renderHookWithStore(() => useGenericAwarenessModalViewModel());

    act(() => {
      store.dispatch(setGenericAwarenessModalContentCards(genericAwarenessModalTestContentCards));
      dispatchThunk(store, openGenericAwarenessModalDialog({ campaignId: "2" }));
    });

    expect(result.current.contentCard?.layout).toBe(GenericAwarenessModalLayout.Carousel);

    act(() => {
      dispatchThunk(store, closeGenericAwarenessModalDialog());
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.contentCard?.layout).toBe(GenericAwarenessModalLayout.Carousel);
  });
});
