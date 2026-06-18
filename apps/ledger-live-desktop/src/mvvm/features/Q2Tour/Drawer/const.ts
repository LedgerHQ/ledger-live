export type Q2TourCtaKey = "q2Tour.cta.seeWhatsNew" | "q2Tour.cta.next" | "q2Tour.cta.gotIt";

export const Q2_TOUR_SLIDES: readonly {
  readonly id: string;
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly ctaKey: Q2TourCtaKey;
}[] = [
  {
    id: "welcome",
    titleKey: "q2Tour.slides.welcome.title",
    descriptionKey: "q2Tour.slides.welcome.description",
    ctaKey: "q2Tour.cta.seeWhatsNew",
  },
  {
    id: "aggregatedBalance",
    titleKey: "q2Tour.slides.aggregatedBalance.title",
    descriptionKey: "q2Tour.slides.aggregatedBalance.description",
    ctaKey: "q2Tour.cta.next",
  },
  {
    id: "pnl",
    titleKey: "q2Tour.slides.pnl.title",
    descriptionKey: "q2Tour.slides.pnl.description",
    ctaKey: "q2Tour.cta.next",
  },
  {
    id: "earnSimulator",
    titleKey: "q2Tour.slides.earnSimulator.title",
    descriptionKey: "q2Tour.slides.earnSimulator.description",
    ctaKey: "q2Tour.cta.next",
  },
  {
    id: "earnUpselling",
    titleKey: "q2Tour.slides.earnUpselling.title",
    descriptionKey: "q2Tour.slides.earnUpselling.description",
    ctaKey: "q2Tour.cta.gotIt",
  },
] as const;

export const Q2_TOUR_SLIDE_COUNT = Q2_TOUR_SLIDES.length;
export const Q2_TOUR_LAST_SLIDE_INDEX = Q2_TOUR_SLIDE_COUNT - 1;
