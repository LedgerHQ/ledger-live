import { renderHook, waitFor } from "@tests/test-renderer";
import { featureIntroMockData } from "../mockData";
import {
  getGenericAwarenessModalCardToOpen,
  useGenericAwarenessModalLogic,
} from "./useGenericAwarenessModalLogic";

const appStartContentCard = {
  ...featureIntroMockData,
  id: "app_start-feature-intro",
};

const deeplinkContentCard = {
  ...featureIntroMockData,
  id: "deeplink-feature-intro",
};

describe("getGenericAwarenessModalCardToOpen", () => {
  it("should return the matching campaign card when a campaign id is set", () => {
    expect(
      getGenericAwarenessModalCardToOpen({
        campaignId: deeplinkContentCard.id,
        cards: [appStartContentCard, deeplinkContentCard],
      }),
    ).toEqual(deeplinkContentCard);
  });

  it("should return the first app-start card when no campaign id is set", () => {
    expect(
      getGenericAwarenessModalCardToOpen({
        cards: [featureIntroMockData, appStartContentCard],
      }),
    ).toEqual(appStartContentCard);
  });

  it("should not fallback to an app-start card when the campaign card is missing", () => {
    expect(
      getGenericAwarenessModalCardToOpen({
        campaignId: deeplinkContentCard.id,
        cards: [appStartContentCard],
      }),
    ).toBeUndefined();
  });
});

describe("useGenericAwarenessModalLogic", () => {
  it("should open the card selected by the logic", async () => {
    const open = jest.fn();

    const { result } = renderHook(() =>
      useGenericAwarenessModalLogic(
        { cards: [appStartContentCard] },
        {
          enabled: true,
          isFocused: true,
          isOpen: false,
          open,
        },
      ),
    );

    await waitFor(() => {
      expect(open).toHaveBeenCalledWith(appStartContentCard.id);
    });
    expect(result.current.shouldMarkAsRead).toBe(true);
  });

  it("should not mark campaign cards as read", () => {
    const open = jest.fn();

    const { result } = renderHook(() =>
      useGenericAwarenessModalLogic(
        { campaignId: deeplinkContentCard.id, cards: [deeplinkContentCard] },
        {
          enabled: true,
          isFocused: true,
          isOpen: true,
          open,
        },
      ),
    );

    expect(result.current.shouldMarkAsRead).toBe(false);
  });

  it("should not open when disabled", () => {
    const open = jest.fn();

    renderHook(() =>
      useGenericAwarenessModalLogic(
        { cards: [appStartContentCard] },
        {
          enabled: false,
          isFocused: true,
          isOpen: false,
          open,
        },
      ),
    );

    expect(open).not.toHaveBeenCalled();
  });

  it("should not open when portfolio is not focused", () => {
    const open = jest.fn();

    renderHook(() =>
      useGenericAwarenessModalLogic(
        { cards: [appStartContentCard] },
        {
          enabled: true,
          isFocused: false,
          isOpen: false,
          open,
        },
      ),
    );

    expect(open).not.toHaveBeenCalled();
  });
});
