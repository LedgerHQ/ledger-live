export const PAGE_TRACKING_Q3_WALLET_V4_TOUR = "Q3 Tour" as const;

export const Q3_TOUR_CONTENT_ID = "q3-tour" as const;

export const Q3_TOUR_STEP_NAMES = {
  "q3WalletV4Tour.intro.title": "A quick tour of the latest",
  "q3WalletV4Tour.contact.title": "Say goodbye to long addresses",
  "q3WalletV4Tour.contactNoPay.title": "Say hello to Contacts",
  "q3WalletV4Tour.pay.title": "Say hello to Pay",
  "q3WalletV4Tour.payNoCard.title": "Say hello to Pay",
  "q3WalletV4Tour.yield.title": "Keep your crypto, finance your projects",
} as const;

export const getQ3TourStepName = (titleKey: string): string => {
  if (titleKey in Q3_TOUR_STEP_NAMES) {
    return Q3_TOUR_STEP_NAMES[titleKey as keyof typeof Q3_TOUR_STEP_NAMES];
  }
  return titleKey;
};
