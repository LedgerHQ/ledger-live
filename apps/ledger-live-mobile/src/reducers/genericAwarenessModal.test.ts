import { GenericAwarenessModalLayout } from "@ledgerhq/live-common/genericAwarenessModal";
import type { GenericAwarenessModalContentCard } from "@ledgerhq/live-common/genericAwarenessModal";
import reducer, {
  appendGenericAwarenessModalContentCards,
  clearLocalGenericAwarenessModalContentCards,
  setGenericAwarenessModalContentCards,
  type GenericAwarenessModalMobileContentCard,
} from "./genericAwarenessModal";

const buildCarouselCard = (id: string): GenericAwarenessModalContentCard => ({
  id,
  layout: GenericAwarenessModalLayout.Carousel,
  data: [],
});

const buildLocalCarouselCard = (id: string): GenericAwarenessModalMobileContentCard => ({
  ...buildCarouselCard(id),
  isLocal: true,
});

describe("genericAwarenessModal reducer", () => {
  it("should keep existing cards when Braze cards are refreshed", () => {
    const initialState = reducer(
      undefined,
      setGenericAwarenessModalContentCards([buildCarouselCard("existing-card")]),
    );

    const nextState = reducer(
      initialState,
      appendGenericAwarenessModalContentCards([buildCarouselCard("new-braze-card")]),
    );

    expect(nextState.contentCards).toEqual([
      buildCarouselCard("existing-card"),
      buildCarouselCard("new-braze-card"),
    ]);
  });

  it("should let refreshed Braze cards replace existing cards with the same id", () => {
    const initialState = reducer(
      undefined,
      setGenericAwarenessModalContentCards([buildCarouselCard("same-id")]),
    );

    const nextState = reducer(
      initialState,
      appendGenericAwarenessModalContentCards([buildCarouselCard("same-id")]),
    );

    expect(nextState.contentCards).toEqual([buildCarouselCard("same-id")]);
  });

  it("should clear local content cards only", () => {
    const initialState = reducer(
      undefined,
      setGenericAwarenessModalContentCards([
        buildCarouselCard("braze-card"),
        buildLocalCarouselCard("local-card"),
      ]),
    );

    const nextState = reducer(initialState, clearLocalGenericAwarenessModalContentCards());

    expect(nextState.contentCards).toEqual([buildCarouselCard("braze-card")]);
  });
});
