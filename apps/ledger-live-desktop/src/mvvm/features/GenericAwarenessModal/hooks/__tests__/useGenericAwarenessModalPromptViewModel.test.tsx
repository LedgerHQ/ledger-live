import { act } from "tests/testSetup";
import { openURL } from "~/renderer/linking";
import { closeGenericAwarenessModalDialog } from "LLD/features/GenericAwarenessModal/genericAwarenessModalDialog";
import { carouselCampaignCard, promptCampaignCard } from "../../__tests__/fixtures";
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
      useGenericAwarenessModalPromptViewModel(undefined),
    );

    expect(result.current).toEqual({
      title: "",
      subtitle: "",
      primaryButtonLabel: "",
      secondaryButtonLabel: "",
      imageUrl: undefined,
      onPrimaryClick: expect.any(Function),
      onSecondaryClick: expect.any(Function),
    });
  });

  it("should return empty content when content card is not prompt", () => {
    const { result } = renderHookWithStore(() =>
      useGenericAwarenessModalPromptViewModel(carouselCampaignCard),
    );

    expect(result.current.title).toBe("");
    expect(result.current.primaryButtonLabel).toBe("");
  });

  it("should map prompt content from the content card", () => {
    const { result } = renderHookWithStore(() =>
      useGenericAwarenessModalPromptViewModel(promptCampaignCard),
    );

    expect(result.current.title).toBe("Stay in control");
    expect(result.current.subtitle).toBe(
      "Move assets to a hardware signer for true self-custody.",
    );
    expect(result.current.primaryButtonLabel).toBe("Learn more");
    expect(result.current.secondaryButtonLabel).toBe("Maybe later");
    expect(result.current.imageUrl).toBe("https://example.com/prompt.png");
  });

  it("should open primary link and close dialog on primary click", () => {
    const { result } = renderHookWithStore(() =>
      useGenericAwarenessModalPromptViewModel(promptCampaignCard),
    );

    act(() => {
      result.current.onPrimaryClick();
    });

    expect(openURL).toHaveBeenCalledWith("https://www.ledger.com/academy");
    expect(jest.mocked(closeGenericAwarenessModalDialog)).toHaveBeenCalled();
  });

  it("should open secondary link and close dialog on secondary click", () => {
    const { result } = renderHookWithStore(() =>
      useGenericAwarenessModalPromptViewModel(promptCampaignCard),
    );

    act(() => {
      result.current.onSecondaryClick();
    });

    expect(openURL).toHaveBeenCalledWith("https://www.ledger.com");
    expect(jest.mocked(closeGenericAwarenessModalDialog)).toHaveBeenCalled();
  });
});
