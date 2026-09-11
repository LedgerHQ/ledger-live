import type { Features } from "@shared/feature-flags";
import { defineReleaseTourSlide, type ReleaseTourConfig } from "LLD/components/ReleaseTour";
import introLight from "./assets/light/intro.webp";
import contactLight from "./assets/light/contact.webp";
import payLight from "./assets/light/pay.webp";
import payNoCardLight from "./assets/light/pay-nocard.webp";
import yieldLight from "./assets/light/yield.webp";
import introDark from "./assets/dark/intro.webp";
import contactDark from "./assets/dark/contact.webp";
import payDark from "./assets/dark/pay.webp";
import payNoCardDark from "./assets/dark/pay-nocard.webp";
import yieldDark from "./assets/dark/yield.webp";

type ReleaseTourVariant = NonNullable<NonNullable<Features["releaseTour"]["params"]>["variant"]>;

export const Q3_TOUR_VARIANTS = ["q3_a", "q3_b", "q3_b2"] as const;
export type Q3TourVariant = (typeof Q3_TOUR_VARIANTS)[number];

export function isQ3TourVariant(variant: string | undefined): variant is Q3TourVariant {
  return variant === "q3_a" || variant === "q3_b" || variant === "q3_b2";
}

const introSlide = defineReleaseTourSlide(
  "intro",
  "q3Tour.slides.intro.title",
  "q3Tour.slides.intro.description",
  "q3Tour.cta.start",
  { light: introLight, dark: introDark },
);

const contactSlide = defineReleaseTourSlide(
  "contact",
  "q3Tour.slides.contact.title",
  "q3Tour.slides.contact.description",
  "q3Tour.cta.next",
  { light: contactLight, dark: contactDark },
);

const contactNoPaySlide = defineReleaseTourSlide(
  "contact-no-pay",
  "q3Tour.slides.contactNoPay.title",
  "q3Tour.slides.contactNoPay.description",
  "q3Tour.cta.next",
  { light: contactLight, dark: contactDark },
);

const paySlide = defineReleaseTourSlide(
  "pay",
  "q3Tour.slides.pay.title",
  "q3Tour.slides.pay.description",
  "q3Tour.cta.next",
  { light: payLight, dark: payDark },
);

const payNoCardSlide = defineReleaseTourSlide(
  "pay-no-card",
  "q3Tour.slides.payNoCard.title",
  "q3Tour.slides.payNoCard.description",
  "q3Tour.cta.next",
  { light: payNoCardLight, dark: payNoCardDark },
);

const yieldSlide = defineReleaseTourSlide(
  "yield",
  "q3Tour.slides.yield.title",
  "q3Tour.slides.yield.description",
  "q3Tour.cta.done",
  { light: yieldLight, dark: yieldDark },
);

const Q3_TOUR_CONFIGS: Record<Q3TourVariant, ReleaseTourConfig> = {
  q3_a: {
    id: "q3-tour",
    slides: [introSlide, contactSlide, paySlide, yieldSlide],
  },
  q3_b: {
    id: "q3-tour",
    slides: [introSlide, contactNoPaySlide, yieldSlide],
  },
  q3_b2: {
    id: "q3-tour",
    slides: [introSlide, contactSlide, payNoCardSlide, yieldSlide],
  },
};

export function getQ3TourConfig(variant: ReleaseTourVariant | undefined): ReleaseTourConfig {
  if (variant === "q3_b" || variant === "q3_b2") {
    return Q3_TOUR_CONFIGS[variant];
  }
  return Q3_TOUR_CONFIGS.q3_a;
}
