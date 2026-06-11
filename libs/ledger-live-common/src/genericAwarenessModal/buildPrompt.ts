import {
  GenericAwarenessModalLayout,
  GenericAwarenessModalPromptInputSchema,
  type GenericAwarenessModalBrazeCard,
  type GenericAwarenessModalParsedPromptInput,
  type GenericAwarenessModalPrompt,
} from "./types";

const parsePromptInput = (
  card: GenericAwarenessModalBrazeCard,
): GenericAwarenessModalParsedPromptInput | undefined => {
  const result = GenericAwarenessModalPromptInputSchema.safeParse(card.extras);
  return result.success ? result.data : undefined;
};

const findFirstPromptInput = (
  cards: GenericAwarenessModalBrazeCard[],
): GenericAwarenessModalParsedPromptInput | undefined => {
  for (const card of cards) {
    const input = parsePromptInput(card);
    if (input) return input;
  }

  return undefined;
};

export const buildPrompt = (
  campaignId: string,
  cards: GenericAwarenessModalBrazeCard[],
): GenericAwarenessModalPrompt | undefined => {
  const prompt = findFirstPromptInput(cards);

  if (!prompt) {
    return undefined;
  }

  return {
    layout: GenericAwarenessModalLayout.Prompt,
    id: campaignId,
    imageUrl: prompt.imageUrl,
    title: prompt.title,
    subtitle: prompt.subtitle,
    primaryButtonLabel: prompt.primaryButtonLabel,
    primaryButtonLink: prompt.primaryButtonLink,
    secondaryButtonLabel: prompt.secondaryButtonLabel,
    secondaryButtonLink: prompt.secondaryButtonLink,
  };
};
