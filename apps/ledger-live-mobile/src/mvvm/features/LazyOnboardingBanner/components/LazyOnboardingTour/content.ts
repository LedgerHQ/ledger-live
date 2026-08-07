import type { ImageSourcePropType } from "react-native";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const step1Image = require("../../assets/tour/step_1.webp");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const step2Image = require("../../assets/tour/step_2.webp");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const step3Image = require("../../assets/tour/step_3.webp");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const step4Image = require("../../assets/tour/step_4.webp");

export type LazyOnboardingTourSlideContent = Readonly<{
  image: ImageSourcePropType;
  // Each asset has its own crop/aspect ratio; using a single shared ratio for all slides
  // distorts the ones that don't match it, so it travels alongside the image.
  imageAspectRatio: number;
  titleKey: string;
  subtitleKey: string;
}>;

export const LAZY_ONBOARDING_TOUR_SLIDES: readonly LazyOnboardingTourSlideContent[] = [
  {
    image: step1Image,
    imageAspectRatio: 480 / 327,
    titleKey: "lazyOnboardingTour.slides.whoControls.title",
    subtitleKey: "lazyOnboardingTour.slides.whoControls.subtitle",
  },
  {
    image: step2Image,
    imageAspectRatio: 480 / 325,
    titleKey: "lazyOnboardingTour.slides.takeBackControl.title",
    subtitleKey: "lazyOnboardingTour.slides.takeBackControl.subtitle",
  },
  {
    image: step3Image,
    imageAspectRatio: 480 / 325,
    titleKey: "lazyOnboardingTour.slides.nothingMoves.title",
    subtitleKey: "lazyOnboardingTour.slides.nothingMoves.subtitle",
  },
  {
    image: step4Image,
    imageAspectRatio: 430 / 404,
    titleKey: "lazyOnboardingTour.slides.startToday.title",
    subtitleKey: "lazyOnboardingTour.slides.startToday.subtitle",
  },
];
