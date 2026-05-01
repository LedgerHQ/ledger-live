jest.unmock("./segment");
jest.unmock("~/renderer/analytics/segment");
jest.unmock("src/renderer/analytics/segment");

jest.mock("~/renderer/logger", () => ({
  __esModule: true,
  default: {
    analyticsPage: jest.fn(),
    analyticsStart: jest.fn(),
    analyticsTrack: jest.fn(),
    onReduxAction: jest.fn(),
  },
}));

import React from "react";
import { render, waitFor } from "tests/testSetup";
import createStore from "~/state-manager/configureStore";
import type { State } from "~/renderer/reducers";
import { INITIAL_STATE as SETTINGS_INITIAL_STATE } from "~/renderer/reducers/settings";
import logger from "~/renderer/logger";
import TrackPage from "./TrackPage";
import { startAnalytics, trackSubject, type LoggableEvent } from "./segment";

const createStoreWithAnalyticsDisabled = () =>
  createStore({
    state: {
      settings: {
        ...SETTINGS_INITIAL_STATE,
        shareAnalytics: false,
        sharePersonalizedRecommandations: false,
        lastAnalyticsConsentDate: null,
      },
    } as State,
  });

describe("TrackPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should only send page tracking without consent when mandatory", async () => {
    const events: LoggableEvent[] = [];
    const subscription = trackSubject.subscribe(event => events.push(event));
    events.length = 0;

    try {
      const store = createStoreWithAnalyticsDisabled();
      await startAnalytics(store);

      const { rerender } = render(
        <TrackPage category="Analytics Consent" name="Optional" flow="test-flow" />,
        { store },
      );

      expect(events).toEqual([]);
      expect(logger.analyticsPage).not.toHaveBeenCalled();

      rerender(
        <TrackPage category="Analytics Consent" name="Mandatory" flow="test-flow" mandatory />,
      );

      await waitFor(() => expect(events).toHaveLength(1));
      expect(events[0]).toEqual(
        expect.objectContaining({
          eventName: "Page Analytics Consent Mandatory",
          eventProperties: expect.objectContaining({
            flow: "test-flow",
            optInAnalytics: false,
            optInPersonalRecommendations: false,
            analyticsInfo: {
              consentDate: null,
              privacyPolicyVersion: null,
            },
          }),
          eventPropertiesWithoutExtra: {
            source: undefined,
            flow: "test-flow",
          },
        }),
      );
      expect(logger.analyticsPage).toHaveBeenCalledWith(
        "Analytics Consent",
        "Mandatory",
        expect.objectContaining({
          flow: "test-flow",
          optInAnalytics: false,
          optInPersonalRecommendations: false,
        }),
      );
    } finally {
      subscription.unsubscribe();
    }
  });
});
