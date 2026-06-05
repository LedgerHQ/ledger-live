import { act } from "tests/testSetup";
import { track, trackPage } from "~/renderer/analytics/segment";
import { openURL } from "~/renderer/linking";
import { closeGenericAwarenessModalDialog } from "LLD/features/GenericAwarenessModal/genericAwarenessModalDialog";
import { PAGE_TRACKING_AWARENESS_MODAL_PROMPT } from "../../analytics/const";
import { carouselCampaignCard, promptCampaignCard } from "../../testUtils/fixtures";
import useGenericAwarenessModalPromptViewModel from "../useGenericAwarenessModalPromptViewModel";
import { renderHookWithStore } from "../testHelpers/renderHookWithStore";

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

jest.mock("LLD/features/GenericAwarenessModal/genericAwarenessModalDialog", () => ({
  closeGenericAwarenessModalDialog: jest.fn(() => jest.fn()),
}));

describe("useGenericAwarenessModalPromptViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return empty content when content card is undefined", () => {
    const { result } = renderHookWithStore(() =>
      useGenericAwarenessModalPromptViewModel(undefined, false),
    );

    expect(result.current).toEqual({
      title: "",
      subtitle: "",
      primaryButtonLabel: "",
      secondaryButtonLabel: "",
      imageUrl: undefined,
      onPrimaryClick: expect.any(Function),
      onSecondaryClick: expect.any(Function),
      onHeaderClose: expect.any(Function),
      onDismiss: expect.any(Function),
    });
  });

  it("should return empty content when content card is not prompt", () => {
    const { result } = renderHookWithStore(() =>
      useGenericAwarenessModalPromptViewModel(carouselCampaignCard, false),
    );

    expect(result.current.title).toBe("");
    expect(result.current.primaryButtonLabel).toBe("");
  });

  it("should map prompt content from the content card", () => {
    const { result } = renderHookWithStore(() =>
      useGenericAwarenessModalPromptViewModel(promptCampaignCard, true),
    );

    expect(result.current.title).toBe("Stay in control");
    expect(result.current.subtitle).toBe("Move assets to a hardware signer for true self-custody.");
    expect(result.current.primaryButtonLabel).toBe("Learn more");
    expect(result.current.secondaryButtonLabel).toBe("Maybe later");
    expect(result.current.imageUrl).toBe("https://example.com/prompt.png");
  });

  it("should track page view when open with a prompt card", () => {
    renderHookWithStore(() => useGenericAwarenessModalPromptViewModel(promptCampaignCard, true));

    expect(trackPage).toHaveBeenCalledWith(
      PAGE_TRACKING_AWARENESS_MODAL_PROMPT,
      undefined,
      expect.objectContaining({ contentId: promptCampaignCard.id }),
      true,
      false,
    );
  });

  it("should track primary click, open the link, and close dialog", () => {
    const { result } = renderHookWithStore(() =>
      useGenericAwarenessModalPromptViewModel(promptCampaignCard, true),
    );

    act(() => {
      result.current.onPrimaryClick();
    });

    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: "learn more",
        ctaPosition: "primary",
        link: "https://www.ledger.com/academy",
      }),
    );
    expect(openURL).toHaveBeenCalledWith("https://www.ledger.com/academy");
    expect(jest.mocked(closeGenericAwarenessModalDialog)).toHaveBeenCalled();
  });

  it("should track secondary click, open the link, and close dialog", () => {
    const { result } = renderHookWithStore(() =>
      useGenericAwarenessModalPromptViewModel(promptCampaignCard, true),
    );

    act(() => {
      result.current.onSecondaryClick();
    });

    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: "maybe later",
        ctaPosition: "secondary",
        link: "https://www.ledger.com",
      }),
    );
    expect(openURL).toHaveBeenCalledWith("https://www.ledger.com");
    expect(jest.mocked(closeGenericAwarenessModalDialog)).toHaveBeenCalled();
  });
});
