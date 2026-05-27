import { act } from "tests/testSetup";
import { GenericAwarenessModalLayout } from "@ledgerhq/live-common/genericAwarenessModal";
import {
  setGenericAwarenessModalCampaignId,
  setGenericAwarenessModalContentCards,
} from "~/renderer/reducers/genericAwarenessModalSlice";
import {
  CAROUSEL_CAMPAIGN_ID,
  carouselCampaignCard,
  genericAwarenessModalTestContentCards,
} from "../../__tests__/fixtures";
import { dispatchGenericAwarenessModalThunk } from "../../__tests__/testHelpers";
import {
  closeGenericAwarenessModalDialog,
  openGenericAwarenessModalDialog,
} from "../../genericAwarenessModalDialog";
import useGenericAwarenessModalViewModel from "../useGenericAwarenessModalViewModel";
import { renderHookWithStore } from "../testHelpers/renderHookWithStore";

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
      dispatchGenericAwarenessModalThunk(
        store,
        openGenericAwarenessModalDialog({ campaignId: CAROUSEL_CAMPAIGN_ID }),
      );
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.contentCard).toEqual(carouselCampaignCard);
  });

  it("should open the dialog when campaign id is set before content cards are available", () => {
    const { result, store, rerender } = renderHookWithStore(() =>
      useGenericAwarenessModalViewModel(),
    );

    act(() => {
      store.dispatch(setGenericAwarenessModalCampaignId(CAROUSEL_CAMPAIGN_ID));
    });

    expect(result.current.isOpen).toBe(false);

    act(() => {
      store.dispatch(setGenericAwarenessModalContentCards(genericAwarenessModalTestContentCards));
    });
    rerender();

    expect(result.current.isOpen).toBe(true);
    expect(result.current.contentCard).toEqual(carouselCampaignCard);
  });

  it("should keep last content card after close", () => {
    const { result, store } = renderHookWithStore(() => useGenericAwarenessModalViewModel());

    act(() => {
      store.dispatch(setGenericAwarenessModalContentCards(genericAwarenessModalTestContentCards));
      dispatchGenericAwarenessModalThunk(
        store,
        openGenericAwarenessModalDialog({ campaignId: CAROUSEL_CAMPAIGN_ID }),
      );
    });

    expect(result.current.contentCard?.layout).toBe(GenericAwarenessModalLayout.Carousel);

    act(() => {
      dispatchGenericAwarenessModalThunk(store, closeGenericAwarenessModalDialog());
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.contentCard?.layout).toBe(GenericAwarenessModalLayout.Carousel);
  });
});
