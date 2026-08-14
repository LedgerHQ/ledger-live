import type { ImageRequireSource } from "react-native";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const step1Image = require("../../assets/tour/step_1.webp");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const step2Image = require("../../assets/tour/step_2.webp");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const step3Image = require("../../assets/tour/step_3.webp");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const step4Image = require("../../assets/tour/step_4.webp");

export type LazyOnboardingTourSlideContent = Readonly<{
  image: ImageRequireSource;
  titleKey: string;
  subtitleKey: string;
}>;

export const LAZY_ONBOARDING_TOUR_SLIDES: readonly LazyOnboardingTourSlideContent[] = [
  {
    image: step1Image,
    titleKey: "lazyOnboardingTour.slides.whoControls.title",
    subtitleKey: "lazyOnboardingTour.slides.whoControls.subtitle",
  },
  {
    image: step2Image,
    titleKey: "lazyOnboardingTour.slides.takeBackControl.title",
    subtitleKey: "lazyOnboardingTour.slides.takeBackControl.subtitle",
  },
  {
    image: step3Image,
    titleKey: "lazyOnboardingTour.slides.nothingMoves.title",
    subtitleKey: "lazyOnboardingTour.slides.nothingMoves.subtitle",
  },
  {
    image: step4Image,
    titleKey: "lazyOnboardingTour.slides.startToday.title",
    subtitleKey: "lazyOnboardingTour.slides.startToday.subtitle",
  },
];
