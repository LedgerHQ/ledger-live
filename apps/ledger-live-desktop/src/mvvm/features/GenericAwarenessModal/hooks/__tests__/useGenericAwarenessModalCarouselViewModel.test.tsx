import { act } from "@testing-library/react";
import { openURL } from "~/renderer/linking";
import { closeGenericAwarenessModalDialog } from "../../genericAwarenessModalDialog";
import { appStartFeatureIntroCard, evenCampaignCarouselCard } from "../../__tests__/fixtures";
import useGenericAwarenessModalCarouselViewModel from "../useGenericAwarenessModalCarouselViewModel";
import { renderHookWithStore } from "./utils/renderHookWithStore";

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

jest.mock("../../genericAwarenessModalDialog", () => ({
  closeGenericAwarenessModalDialog: jest.fn(() => () => ({
    type: "CLOSE_GENERIC_AWARENESS_MODAL",
  })),
}));

describe("useGenericAwarenessModalCarouselViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return empty slides when content card is undefined", () => {
    const { result } = renderHookWithStore(() =>
      useGenericAwarenessModalCarouselViewModel(undefined),
    );

    expect(result.current.slides).toEqual([]);
  });

  it("should return empty slides when content card is not a carousel", () => {
    const { result } = renderHookWithStore(() =>
      useGenericAwarenessModalCarouselViewModel(appStartFeatureIntroCard),
    );

    expect(result.current.slides).toEqual([]);
  });

  it("should expose carousel slides from the content card", () => {
    const { result } = renderHookWithStore(() =>
      useGenericAwarenessModalCarouselViewModel(evenCampaignCarouselCard),
    );

    expect(result.current.slides).toEqual(evenCampaignCarouselCard.data);
    expect(result.current.slides).toHaveLength(4);
  });

  it("should open slide link and close dialog on primary click", () => {
    const { result } = renderHookWithStore(() =>
      useGenericAwarenessModalCarouselViewModel(evenCampaignCarouselCard),
    );
    expect(result.current.slides[0]).toEqual(evenCampaignCarouselCard.data[0]);

    act(() => {
      result.current.onSlidePrimaryClick(evenCampaignCarouselCard.data[0]);
    });

    expect(openURL).toHaveBeenCalledWith("https://www.ledger.com/products/ledger-flex");
    expect(jest.mocked(closeGenericAwarenessModalDialog)).toHaveBeenCalled();
  });
});
