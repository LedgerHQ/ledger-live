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

export const buildPrompt = (
  campaignId: string,
  cards: GenericAwarenessModalBrazeCard[],
): GenericAwarenessModalPrompt | undefined => {
  const input = cards.flatMap(card => {
    const parsed = parsePromptInput(card);
    return parsed ? [parsed] : [];
  })[0];

  if (!input) {
    return undefined;
  }

  return {
    layout: GenericAwarenessModalLayout.Prompt,
    id: campaignId,
    imageUrl: input.imageUrl,
    title: input.title,
    subtitle: input.subtitle,
    primaryButtonLabel: input.primaryButtonLabel,
    primaryButtonLink: input.primaryButtonLink,
    secondaryButtonLabel: input.secondaryButtonLabel,
    secondaryButtonLink: input.secondaryButtonLink,
  };
};
