import { buildPrompt } from "../buildPrompt";
import {
  GenericAwarenessModalLayout,
  type GenericAwarenessModalBrazeCard,
  type GenericAwarenessModalInputExtras,
} from "../types";

const makeCard = (
  id: string,
  extras: GenericAwarenessModalInputExtras,
): GenericAwarenessModalBrazeCard => ({
  id,
  extras,
});

describe("buildPrompt", () => {
  it("should build prompt content from a valid prompt input", () => {
    const promptCard = makeCard("prompt-1", {
      layout: GenericAwarenessModalLayout.Prompt,
      campaignId: "campaign-1",
      imageUrlLight: "https://example.com/prompt.png",
      imageUrlDark: "",
      title: "Prompt title",
      subtitle: "Prompt subtitle",
      primaryButtonLabel: "Primary",
      primaryButtonLink: "ledgerwallet://primary",
      secondaryButtonLabel: "Secondary",
      secondaryButtonLink: "ledgerwallet://secondary",
    });

    const prompt = buildPrompt("campaign-1", [promptCard]);

    expect(prompt).toEqual({
      layout: GenericAwarenessModalLayout.Prompt,
      id: "campaign-1",
      imageUrlLight: "https://example.com/prompt.png",
      imageUrlDark: "",
      title: "Prompt title",
      subtitle: "Prompt subtitle",
      primaryButtonLabel: "Primary",
      primaryButtonLink: "ledgerwallet://primary",
      secondaryButtonLabel: "Secondary",
      secondaryButtonLink: "ledgerwallet://secondary",
    });
  });

  it("should default missing prompt fields to empty strings", () => {
    const promptCard = makeCard("prompt-1", {
      layout: GenericAwarenessModalLayout.Prompt,
      campaignId: "campaign-1",
    });

    const prompt = buildPrompt("campaign-1", [promptCard]);

    expect(prompt).toEqual({
      layout: GenericAwarenessModalLayout.Prompt,
      id: "campaign-1",
      imageUrlLight: "",
      imageUrlDark: "",
      title: "",
      subtitle: "",
      primaryButtonLabel: "",
      primaryButtonLink: "",
      secondaryButtonLabel: "",
      secondaryButtonLink: "",
    });
  });

  it("should return undefined when there is no valid prompt input", () => {
    const carouselCard = makeCard("carousel", {
      layout: GenericAwarenessModalLayout.Carousel,
      campaignId: "campaign-1",
      index: "0",
      title: "Ignored",
    });

    const prompt = buildPrompt("campaign-1", [carouselCard]);

    expect(prompt).toBeUndefined();
  });

  it("should use the first valid prompt card when multiple cards are provided", () => {
    const firstPromptCard = makeCard("first", {
      layout: GenericAwarenessModalLayout.Prompt,
      campaignId: "campaign-1",
      title: "First",
    });
    const secondPromptCard = makeCard("second", {
      layout: GenericAwarenessModalLayout.Prompt,
      campaignId: "campaign-1",
      title: "Second",
    });

    const prompt = buildPrompt("campaign-1", [secondPromptCard, firstPromptCard]);

    expect(prompt?.title).toBe("Second");
  });
});
