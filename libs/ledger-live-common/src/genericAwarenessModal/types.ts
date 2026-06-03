import { z } from "zod";

export enum GenericAwarenessModalLayout {
  Carousel = "carousel",
  FeatureIntro = "featureIntro",
  Prompt = "prompt",
}

export enum FeatureIntroRole {
  Main = "main",
  Item = "item",
}

export type GenericAwarenessModalLocation = "generic_awareness_modal";

const GENERIC_AWARENESS_MODAL_LOCATION = "generic_awareness_modal" satisfies GenericAwarenessModalLocation;

export const GenericAwarenessModalCampaignIdInputSchema = z.string().trim();

export const GenericAwarenessModalStringFieldSchema = z
  .string()
  .catch("")
  .transform(value => value.trim());

export const GenericAwarenessModalLocationInputSchema = z
  .string()
  .trim()
  .refine(value => value.toLowerCase() === GENERIC_AWARENESS_MODAL_LOCATION)
  .transform(() => GENERIC_AWARENESS_MODAL_LOCATION)
  .default(GENERIC_AWARENESS_MODAL_LOCATION);

export const GenericAwarenessModalCarouselLayoutInputSchema = z
  .string()
  .trim()
  .refine(value => value.toLowerCase() === GenericAwarenessModalLayout.Carousel.toLowerCase())
  .transform(() => GenericAwarenessModalLayout.Carousel);

export const GenericAwarenessModalFeatureIntroLayoutInputSchema = z
  .string()
  .trim()
  .refine(value => value.toLowerCase() === GenericAwarenessModalLayout.FeatureIntro.toLowerCase())
  .transform(() => GenericAwarenessModalLayout.FeatureIntro);

export const GenericAwarenessModalPromptLayoutInputSchema = z
  .string()
  .trim()
  .refine(value => value.toLowerCase() === GenericAwarenessModalLayout.Prompt.toLowerCase())
  .transform(() => GenericAwarenessModalLayout.Prompt);

export const GenericAwarenessModalFeatureIntroMainRoleInputSchema = z
  .string()
  .trim()
  .refine(value => value.toLowerCase() === FeatureIntroRole.Main)
  .transform(() => FeatureIntroRole.Main);

export const GenericAwarenessModalFeatureIntroItemRoleInputSchema = z
  .string()
  .trim()
  .refine(value => value.toLowerCase() === FeatureIntroRole.Item)
  .transform(() => FeatureIntroRole.Item);

export const GenericAwarenessModalInputIndexSchema = z
  .string()
  .trim()
  .regex(/^\d+$/)
  .transform(value => Number.parseInt(value, 10));

export const GenericAwarenessModalCarouselSlideSchema = z.object({
  title: GenericAwarenessModalStringFieldSchema,
  subtitle: GenericAwarenessModalStringFieldSchema,
  imageUrl: GenericAwarenessModalStringFieldSchema,
  primaryButtonLabel: GenericAwarenessModalStringFieldSchema,
  primaryButtonLink: GenericAwarenessModalStringFieldSchema,
});

export const GenericAwarenessModalCarouselInputSchema = z.object({
  layout: GenericAwarenessModalCarouselLayoutInputSchema,
  campaignId: GenericAwarenessModalCampaignIdInputSchema,
  index: GenericAwarenessModalInputIndexSchema,
  location: GenericAwarenessModalLocationInputSchema,
  title: GenericAwarenessModalStringFieldSchema,
  subtitle: GenericAwarenessModalStringFieldSchema,
  imageUrl: GenericAwarenessModalStringFieldSchema,
  primaryButtonLabel: GenericAwarenessModalStringFieldSchema,
  primaryButtonLink: GenericAwarenessModalStringFieldSchema,
});

export const GenericAwarenessModalFeatureIntroMainInputSchema = z.object({
  layout: GenericAwarenessModalFeatureIntroLayoutInputSchema,
  campaignId: GenericAwarenessModalCampaignIdInputSchema,
  role: GenericAwarenessModalFeatureIntroMainRoleInputSchema,
  location: GenericAwarenessModalLocationInputSchema,
  title: GenericAwarenessModalStringFieldSchema,
  subtitle: GenericAwarenessModalStringFieldSchema,
  imageUrl: GenericAwarenessModalStringFieldSchema,
  primaryButtonLabel: GenericAwarenessModalStringFieldSchema,
  primaryButtonLink: GenericAwarenessModalStringFieldSchema,
  secondaryButtonLabel: GenericAwarenessModalStringFieldSchema,
  secondaryButtonLink: GenericAwarenessModalStringFieldSchema,
});

export const GenericAwarenessModalFeatureIntroItemInputSchema = z.object({
  layout: GenericAwarenessModalFeatureIntroLayoutInputSchema,
  campaignId: GenericAwarenessModalCampaignIdInputSchema,
  role: GenericAwarenessModalFeatureIntroItemRoleInputSchema,
  index: GenericAwarenessModalInputIndexSchema,
  location: GenericAwarenessModalLocationInputSchema,
  icon: GenericAwarenessModalStringFieldSchema,
  title: GenericAwarenessModalStringFieldSchema,
  subtitle: GenericAwarenessModalStringFieldSchema,
});

export const GenericAwarenessModalPromptInputSchema = z.object({
  layout: GenericAwarenessModalPromptLayoutInputSchema,
  campaignId: GenericAwarenessModalCampaignIdInputSchema,
  location: GenericAwarenessModalLocationInputSchema,
  imageUrl: GenericAwarenessModalStringFieldSchema,
  title: GenericAwarenessModalStringFieldSchema,
  subtitle: GenericAwarenessModalStringFieldSchema,
  primaryButtonLabel: GenericAwarenessModalStringFieldSchema,
  primaryButtonLink: GenericAwarenessModalStringFieldSchema,
  secondaryButtonLabel: GenericAwarenessModalStringFieldSchema,
  secondaryButtonLink: GenericAwarenessModalStringFieldSchema,
});

export const GenericAwarenessModalInputSchema = z.union([
  GenericAwarenessModalCarouselInputSchema,
  GenericAwarenessModalPromptInputSchema,
  GenericAwarenessModalFeatureIntroMainInputSchema,
  GenericAwarenessModalFeatureIntroItemInputSchema,
]);

export type GenericAwarenessModalInputIndex = z.input<typeof GenericAwarenessModalInputIndexSchema>;

export type GenericAwarenessModalParsedInputIndex = z.output<
  typeof GenericAwarenessModalInputIndexSchema
>;

export type GenericAwarenessModalCarouselSlide = z.output<
  typeof GenericAwarenessModalCarouselSlideSchema
>;

export type GenericAwarenessModalCarouselInput = z.input<
  typeof GenericAwarenessModalCarouselInputSchema
>;

export type GenericAwarenessModalParsedCarouselInput = z.output<
  typeof GenericAwarenessModalCarouselInputSchema
>;

export type GenericAwarenessModalPromptInput = z.input<
  typeof GenericAwarenessModalPromptInputSchema
>;

export type GenericAwarenessModalParsedPromptInput = z.output<
  typeof GenericAwarenessModalPromptInputSchema
>;

export type GenericAwarenessModalFeatureIntroMainInput = z.input<
  typeof GenericAwarenessModalFeatureIntroMainInputSchema
>;

export type GenericAwarenessModalParsedFeatureIntroMainInput = z.output<
  typeof GenericAwarenessModalFeatureIntroMainInputSchema
>;

export type GenericAwarenessModalFeatureIntroItemInput = z.input<
  typeof GenericAwarenessModalFeatureIntroItemInputSchema
>;

export type GenericAwarenessModalParsedFeatureIntroItemInput = z.output<
  typeof GenericAwarenessModalFeatureIntroItemInputSchema
>;

export type GenericAwarenessModalInput =
  | GenericAwarenessModalCarouselInput
  | GenericAwarenessModalPromptInput
  | GenericAwarenessModalFeatureIntroMainInput
  | GenericAwarenessModalFeatureIntroItemInput;

export type GenericAwarenessModalParsedInput = z.output<typeof GenericAwarenessModalInputSchema>;

export type GenericAwarenessModalInputExtras = Partial<{
  campaignId: string;
  layout: GenericAwarenessModalLayout | string;
  location: GenericAwarenessModalLocation | string;
  role: FeatureIntroRole | string;
  index: GenericAwarenessModalInputIndex;
  title: string;
  subtitle: string;
  imageUrl: string;
  primaryButtonLabel: string;
  primaryButtonLink: string;
  secondaryButtonLabel: string;
  secondaryButtonLink: string;
  icon: string;
}> &
  Record<string, string | number | undefined>;

export type GenericAwarenessModalBrazeCard = {
  id: string;
  extras?: GenericAwarenessModalInputExtras;
};

export type GenericAwarenessModalCarousel = {
  layout: GenericAwarenessModalLayout.Carousel;
  id: string;
  data: GenericAwarenessModalCarouselSlide[];
};

export type GenericAwarenessModalFeatureIntroItem = {
  icon: string;
  title: string;
  subtitle: string;
};

export type GenericAwarenessModalFeatureIntro = {
  layout: GenericAwarenessModalLayout.FeatureIntro;
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  primaryButtonLabel: string;
  primaryButtonLink: string;
  secondaryButtonLabel: string;
  secondaryButtonLink: string;
  items: GenericAwarenessModalFeatureIntroItem[];
};

export type GenericAwarenessModalPrompt = {
  layout: GenericAwarenessModalLayout.Prompt;
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  primaryButtonLabel: string;
  primaryButtonLink: string;
  secondaryButtonLabel: string;
  secondaryButtonLink: string;
};

export type GenericAwarenessModalContentCard =
  | GenericAwarenessModalCarousel
  | GenericAwarenessModalFeatureIntro
  | GenericAwarenessModalPrompt;

export type GenericAwarenessModalOutput = GenericAwarenessModalContentCard;

export type GenericAwarenessModalCarouselExtrasType = GenericAwarenessModalCarouselInput;

export type GenericAwarenessModalPromptExtrasType = GenericAwarenessModalPromptInput;

export type GenericAwarenessModalFeatureIntroExtrasMainType =
  GenericAwarenessModalFeatureIntroMainInput;

export type GenericAwarenessModalFeatureIntroExtrasItemType =
  GenericAwarenessModalFeatureIntroItemInput;

export type GenericAwarenessModalFeatureIntroExtrasType =
  | GenericAwarenessModalFeatureIntroExtrasMainType
  | GenericAwarenessModalFeatureIntroExtrasItemType;
