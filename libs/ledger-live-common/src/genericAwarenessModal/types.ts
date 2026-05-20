import { z } from "zod";

export enum GenericAwarenessModalLayout {
  Carousel = "carousel",
  FeatureIntro = "featureIntro",
}

export enum FeatureIntroRole {
  Main = "main",
  Item = "item",
}

export type GenericAwarenessModalLocation = "generic_awareness_modal";

export const GenericAwarenessModalInputIndexSchema = z
  .string()
  .transform(value => Number.parseInt(value, 10) || 0);

export const GenericAwarenessModalCarouselSlideSchema = z.object({
  title: z.string().catch(""),
  subtitle: z.string().catch(""),
  imageUrl: z.string().catch(""),
  primaryButtonLabel: z.string().catch(""),
  primaryButtonLink: z.string().catch(""),
});

export const GenericAwarenessModalCarouselInputSchema = z.object({
  layout: z.literal(GenericAwarenessModalLayout.Carousel),
  campaignId: z.string(),
  index: GenericAwarenessModalInputIndexSchema,
  location: z.literal("generic_awareness_modal").default("generic_awareness_modal"),
  title: z.string().catch(""),
  subtitle: z.string().catch(""),
  imageUrl: z.string().catch(""),
  primaryButtonLabel: z.string().catch(""),
  primaryButtonLink: z.string().catch(""),
});

export const GenericAwarenessModalFeatureIntroMainInputSchema = z.object({
  layout: z.literal(GenericAwarenessModalLayout.FeatureIntro),
  campaignId: z.string(),
  role: z.literal(FeatureIntroRole.Main),
  location: z.literal("generic_awareness_modal").default("generic_awareness_modal"),
  title: z.string().catch(""),
  subtitle: z.string().catch(""),
  imageUrl: z.string().catch(""),
  primaryButtonLabel: z.string().catch(""),
  primaryButtonLink: z.string().catch(""),
  secondaryButtonLabel: z.string().catch(""),
  secondaryButtonLink: z.string().catch(""),
});

export const GenericAwarenessModalFeatureIntroItemInputSchema = z.object({
  layout: z.literal(GenericAwarenessModalLayout.FeatureIntro),
  campaignId: z.string(),
  role: z.literal(FeatureIntroRole.Item),
  index: GenericAwarenessModalInputIndexSchema,
  location: z.literal("generic_awareness_modal").default("generic_awareness_modal"),
  icon: z.string().catch(""),
  title: z.string().catch(""),
  subtitle: z.string().catch(""),
});

export const GenericAwarenessModalInputSchema = z.union([
  GenericAwarenessModalCarouselInputSchema,
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

export type GenericAwarenessModalContentCard =
  | GenericAwarenessModalCarousel
  | GenericAwarenessModalFeatureIntro;

export type GenericAwarenessModalOutput = GenericAwarenessModalContentCard;

export type GenericAwarenessModalCarouselExtrasType = GenericAwarenessModalCarouselInput;

export type GenericAwarenessModalFeatureIntroExtrasMainType =
  GenericAwarenessModalFeatureIntroMainInput;

export type GenericAwarenessModalFeatureIntroExtrasItemType =
  GenericAwarenessModalFeatureIntroItemInput;

export type GenericAwarenessModalFeatureIntroExtrasType =
  | GenericAwarenessModalFeatureIntroExtrasMainType
  | GenericAwarenessModalFeatureIntroExtrasItemType;
