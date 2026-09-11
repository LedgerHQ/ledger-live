import { defineReleaseTourSlide, type ReleaseTourConfig } from "LLD/components/ReleaseTour";
import { SLIDE_IMAGES } from "./assets";

export const Q2_TOUR_SLIDES = [
  defineReleaseTourSlide(
    "welcome",
    "q2Tour.slides.welcome.title",
    "q2Tour.slides.welcome.description",
    "q2Tour.cta.seeWhatsNew",
    { light: SLIDE_IMAGES.light[0], dark: SLIDE_IMAGES.dark[0] },
  ),
  defineReleaseTourSlide(
    "aggregatedBalance",
    "q2Tour.slides.aggregatedBalance.title",
    "q2Tour.slides.aggregatedBalance.description",
    "q2Tour.cta.next",
    { light: SLIDE_IMAGES.light[1], dark: SLIDE_IMAGES.dark[1] },
  ),
  defineReleaseTourSlide(
    "pnl",
    "q2Tour.slides.pnl.title",
    "q2Tour.slides.pnl.description",
    "q2Tour.cta.next",
    { light: SLIDE_IMAGES.light[2], dark: SLIDE_IMAGES.dark[2] },
  ),
  defineReleaseTourSlide(
    "earnSimulator",
    "q2Tour.slides.earnSimulator.title",
    "q2Tour.slides.earnSimulator.description",
    "q2Tour.cta.next",
    { light: SLIDE_IMAGES.light[3], dark: SLIDE_IMAGES.dark[3] },
  ),
  defineReleaseTourSlide(
    "earnUpselling",
    "q2Tour.slides.earnUpselling.title",
    "q2Tour.slides.earnUpselling.description",
    "q2Tour.cta.gotIt",
    { light: SLIDE_IMAGES.light[4], dark: SLIDE_IMAGES.dark[4] },
  ),
] as const satisfies ReleaseTourConfig["slides"];

export const Q2_TOUR_SLIDE_COUNT = Q2_TOUR_SLIDES.length;
export const Q2_TOUR_LAST_SLIDE_INDEX = Q2_TOUR_SLIDE_COUNT - 1;

export const Q2_TOUR_CONFIG: ReleaseTourConfig = {
  id: "q2-tour",
  slides: Q2_TOUR_SLIDES,
};
