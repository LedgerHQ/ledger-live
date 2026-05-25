export type DevLayoutMode = "carousel" | "featureIntro";
export type DevTriggerMode = "appStart" | "bannerClick";

export type CarouselSlideForm = {
  title: string;
  subtitle: string;
  imageUrl: string;
  primaryButtonLabel: string;
  primaryButtonLink: string;
};

export type FeatureIntroItemForm = {
  icon: string;
  title: string;
  subtitle: string;
};

export type GenericAwarenessModalDevFormState = {
  layout: DevLayoutMode;
  trigger: DevTriggerMode;
  slides: CarouselSlideForm[];
  title: string;
  subtitle: string;
  imageUrl: string;
  primaryButtonLabel: string;
  primaryButtonLink: string;
  secondaryButtonLabel: string;
  secondaryButtonLink: string;
  items: FeatureIntroItemForm[];
};

export type SelectOption<T extends string = string> = {
  value: T;
  label: string;
};
