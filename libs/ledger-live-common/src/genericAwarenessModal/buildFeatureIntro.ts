import {
  GenericAwarenessModalFeatureIntroItemInputSchema,
  GenericAwarenessModalFeatureIntroMainInputSchema,
  GenericAwarenessModalLayout,
  type GenericAwarenessModalBrazeCard,
  type GenericAwarenessModalFeatureIntro,
  type GenericAwarenessModalFeatureIntroItem,
  type GenericAwarenessModalParsedFeatureIntroItemInput,
  type GenericAwarenessModalParsedFeatureIntroMainInput,
} from "./types";

const buildFeatureIntroItem = (
  input: GenericAwarenessModalParsedFeatureIntroItemInput,
): GenericAwarenessModalFeatureIntroItem => ({
  icon: input.icon,
  title: input.title,
  subtitle: input.subtitle,
});

const parseFeatureIntroMainInput = (
  card: GenericAwarenessModalBrazeCard,
): GenericAwarenessModalParsedFeatureIntroMainInput | undefined => {
  const result = GenericAwarenessModalFeatureIntroMainInputSchema.safeParse(card.extras);
  return result.success ? result.data : undefined;
};

const parseFeatureIntroItemInput = (
  card: GenericAwarenessModalBrazeCard,
): GenericAwarenessModalParsedFeatureIntroItemInput | undefined => {
  const result = GenericAwarenessModalFeatureIntroItemInputSchema.safeParse(card.extras);
  return result.success ? result.data : undefined;
};

export const buildFeatureIntro = (
  campaignId: string,
  cards: GenericAwarenessModalBrazeCard[],
): GenericAwarenessModalFeatureIntro | undefined => {
  const main = cards.flatMap(card => {
    const input = parseFeatureIntroMainInput(card);
    return input ? [input] : [];
  })[0];

  if (!main) {
    return undefined;
  }

  const items = cards
    .flatMap(card => {
      const input = parseFeatureIntroItemInput(card);
      return input ? [input] : [];
    })
    .sort((a, b) => a.index - b.index)
    .map(buildFeatureIntroItem);

  return {
    layout: GenericAwarenessModalLayout.FeatureIntro,
    id: campaignId,
    title: main.title,
    subtitle: main.subtitle,
    imageUrl: main.imageUrl,
    primaryButtonLabel: main.primaryButtonLabel,
    primaryButtonLink: main.primaryButtonLink,
    secondaryButtonLabel: main.secondaryButtonLabel,
    secondaryButtonLink: main.secondaryButtonLink,
    items,
  };
};
