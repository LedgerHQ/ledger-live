export const PAGE_TRACKING_Q3_TOUR = "Q3 Tour" as const;

export const Q3_TOUR_CONTENT_ID = "q3-tour" as const;

export const Q3_TOUR_STEP_NAMES = {
  "q3Tour.slides.intro.title": "A quick tour of the latest",
  "q3Tour.slides.contact.title": "Say goodbye to long addresses",
  "q3Tour.slides.contactNoPay.title": "Say hello to Contacts",
  "q3Tour.slides.pay.title": "Say hello to Pay",
  "q3Tour.slides.payNoCard.title": "Say hello to Pay",
  "q3Tour.slides.yield.title": "Keep your crypto, finance your projects",
} as const;

export const getQ3TourStepName = (titleKey: string): string => {
  if (titleKey in Q3_TOUR_STEP_NAMES) {
    return Q3_TOUR_STEP_NAMES[titleKey as keyof typeof Q3_TOUR_STEP_NAMES];
  }
  return titleKey;
};
