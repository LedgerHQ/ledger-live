import { configureStore } from "@reduxjs/toolkit";
import {
  FEATURE_FLAGS_DEFAULTS,
  FEATURE_FLAGS_INITIAL_STATE,
  featureFlagsReducer,
  type FeatureId,
} from "@shared/feature-flags";
import { payCardFeatureTourSlice } from "../../../state";

type PayTabFeatureFlag = Extract<FeatureId, "lwdPayTab" | "lwmPayTab">;

export function makeFeatureTourStore(payTabFeatureFlag: PayTabFeatureFlag, card: boolean) {
  const payTab = FEATURE_FLAGS_DEFAULTS[payTabFeatureFlag];

  return configureStore({
    reducer: {
      payCardFeatureTour: payCardFeatureTourSlice.reducer,
      featureFlags: featureFlagsReducer,
    },
    preloadedState: {
      featureFlags: {
        ...FEATURE_FLAGS_INITIAL_STATE,
        resolved: {
          ...FEATURE_FLAGS_DEFAULTS,
          [payTabFeatureFlag]: {
            ...payTab,
            params: { ...payTab.params, card_native: card },
          },
        },
      },
    },
  });
}

/** The `payTab.featureTour.*` copy each app ships, mirrored here for the container tests. */
export const FEATURE_TOUR_RESOURCES = {
  en: {
    translation: {
      payTab: {
        featureTour: {
          title: "All your payments, in one place",
          description:
            "Meet your new Pay tab, making your crypto ready for everyday money moments.",
          cta: "Explore Pay",
          rows: {
            global: {
              title: "Pay your contacts",
              description: "Send crypto to saved addresses.",
            },
            volatility: {
              title: "Request payments",
              description: "Ask Contacts to send funds straight to you.",
            },
            card: {
              title: "Shop worldwide with crypto card",
              description: "And earn uncapped 1% cashback.",
            },
          },
        },
      },
    },
  },
};
