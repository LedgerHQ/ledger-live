import type * as Icons from "@ledgerhq/lumen-ui-rnative/symbols";

// TODO: use types from ledger-live-common

export type CarouselSlide = {
  imageUrl: string;
  title: string;
  subtitle: string;
  primaryButtonAction: "navigate" | "dismiss" | "next";
  primaryButtonLabel: string;
  primaryButtonLink: string;
};

export type FeatureIntroListItem = {
  icon: keyof typeof Icons;
  title: string;
  description: string;
};

export type FeatureIntroButtonAction = "navigate" | "dismiss";

export type FeatureIntroContent = {
  imageUrl: string;
  title: string;
  description: string;
  items: FeatureIntroListItem[];
  primaryButtonAction: FeatureIntroButtonAction;
  primaryButtonLabel: string;
  primaryButtonLink: string;
  secondaryButtonAction: FeatureIntroButtonAction;
  secondaryButtonLabel: string;
  secondaryButtonLink: string;
};

export type GenericAwarenessModalData =
  | {
      id: string;
      layout: "carousel";
      content: CarouselSlide[];
    }
  | {
      id: string;
      layout: "featureIntro";
      content: FeatureIntroContent;
    };
