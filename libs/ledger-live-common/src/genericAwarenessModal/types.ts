export enum GenericAwarenessModalLayout {
  Carousel = "carousel",
  FeatureIntro = "featureIntro",
}

/** Carousel layout */

export type GenericAwarenessModalCarouselSlide = {
  title: string;
  subtitle: string;
  imageUrl: string;
  primaryButtonLabel: string;
  primaryButtonLink: string;
};

export type GenericAwarenessModalCarousel = {
  layout: GenericAwarenessModalLayout.Carousel;
  id: string;
  data: GenericAwarenessModalCarouselSlide[];
};

/**
 * Original structure of the extras field of content card for carousel
 */
export type GenericAwarenessModalCarouselExtrasType = GenericAwarenessModalCarouselSlide & {
  layout: GenericAwarenessModalLayout.Carousel;
  campaignId: string;
  index: number;
  location: "generic_awareness_modal";
};

/** Feature intro layout */

export enum FeatureIntroRole {
  Main = "main",
  Item = "item",
}

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

/**
 * Original structure of the extras field of content card for feature intro main
 */
export type GenericAwarenessModalFeatureIntroExtrasMainType = Omit<
  GenericAwarenessModalFeatureIntro,
  "id" | "items"
> & {
  campaignId: string;
  role: FeatureIntroRole.Main;
  location: "generic_awareness_modal";
};

/**
 * Original structure of the extras field of content card for feature intro item
 */
export type GenericAwarenessModalFeatureIntroExtrasItemType =
  GenericAwarenessModalFeatureIntroItem & {
    layout: GenericAwarenessModalLayout.FeatureIntro;
    campaignId: string;
    role: FeatureIntroRole.Item;
    index: number;
    location: "generic_awareness_modal";
  };

export type GenericAwarenessModalFeatureIntroExtrasType =
  | GenericAwarenessModalFeatureIntroExtrasMainType
  | GenericAwarenessModalFeatureIntroExtrasItemType;

export type GenericAwarenessModalContentCard =
  | GenericAwarenessModalCarousel
  | GenericAwarenessModalFeatureIntro;
