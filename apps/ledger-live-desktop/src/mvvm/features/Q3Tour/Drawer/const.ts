import { defineQuarterlyTourSlide, type QuarterlyTourConfig } from "LLD/components/QuarterlyTour";
import introLight from "./assets/light/intro.webp";
import contactLight from "./assets/light/contact.webp";
import payLight from "./assets/light/pay.webp";
import yieldLight from "./assets/light/yield.webp";
import introDark from "./assets/dark/intro.webp";
import contactDark from "./assets/dark/contact.webp";
import payDark from "./assets/dark/pay.webp";
import yieldDark from "./assets/dark/yield.webp";

export const Q3_TOUR_SLIDES = [
  defineQuarterlyTourSlide(
    "intro",
    "q3Tour.slides.intro.title",
    "q3Tour.slides.intro.description",
    "q3Tour.cta.start",
    { light: introLight, dark: introDark },
  ),
  defineQuarterlyTourSlide(
    "contact",
    "q3Tour.slides.contact.title",
    "q3Tour.slides.contact.description",
    "q3Tour.cta.next",
    { light: contactLight, dark: contactDark },
  ),
  defineQuarterlyTourSlide(
    "pay",
    "q3Tour.slides.pay.title",
    "q3Tour.slides.pay.description",
    "q3Tour.cta.next",
    { light: payLight, dark: payDark },
  ),
  defineQuarterlyTourSlide(
    "yield",
    "q3Tour.slides.yield.title",
    "q3Tour.slides.yield.description",
    "q3Tour.cta.done",
    { light: yieldLight, dark: yieldDark },
  ),
] as const satisfies QuarterlyTourConfig["slides"];

export const Q3_TOUR_SLIDE_COUNT = Q3_TOUR_SLIDES.length;

export const Q3_TOUR_CONFIG: QuarterlyTourConfig = {
  id: "q3-tour",
  slides: Q3_TOUR_SLIDES,
};
