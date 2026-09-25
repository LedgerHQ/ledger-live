import React from "react";
import { NativeModules } from "react-native";
import { UserId } from "@domain/entity-client-identity";
import { http, HttpResponse } from "msw";
import { render, waitFor } from "@tests/test-renderer";
import { server } from "@tests/server";
import type { State } from "~/reducers/types";
import { flush, track } from "@shared/analytics";
import { start as startAnalytics } from "../segment";

jest.unmock("../segment");
jest.unmock("@shared/analytics");

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useIsFocused: () => true,
}));

// Global jest-setup stubs createClient with no-op track/identify. Use the real RN
// SDK (POSTs to /v1/b) so MSW can observe HTTP; flushAt: 1 so one TrackScreen
// event is enough to flush.
const { createClient: mockCreateClient } = require("@segment/analytics-react-native") as {
  createClient: jest.Mock;
};
const { createClient: actualCreateClient } = jest.requireActual(
  "@segment/analytics-react-native",
) as { createClient: typeof mockCreateClient };

mockCreateClient.mockImplementation(config =>
  actualCreateClient({
    ...config,
    flushAt: 1,
    flushInterval: 0,
    defaultSettings: { integrations: { "Segment.io": {} } },
  }),
);

NativeModules.AnalyticsReactNative = {
  getContextInfo: async () => ({}),
};

const REAL_USER_ID = UserId.fromString("11111111-1111-1111-1111-111111111111");

const withAnalyticsEnabled = (state: State): State => ({
  ...state,
  identities: { ...state.identities, userId: REAL_USER_ID },
  settings: {
    ...state.settings,
    analyticsEnabled: true,
    personalizedRecommendationsEnabled: false,
  },
});

const endpoints = {
  batch: jest.fn().mockReturnValue(HttpResponse.json({ success: true })),
};

describe("Integration with Segment.io", () => {
  beforeEach(async () => {
    jest.useRealTimers();
    server.use(
      http.post("https://api.segment.io/v1/b", endpoints.batch),
      http.get("https://cdn-settings.segment.com/v1/projects/:writeKey/settings", () =>
        HttpResponse.json({ integrations: { "Segment.io": {} } }),
      ),
    );

    const { store, rerender: _rerender } = render(<></>, {
      overrideInitialState: withAnalyticsEnabled,
    });
    rerender = _rerender;
    await startAnalytics(store);
  });

  afterEach(() => {
    jest.useFakeTimers();
    endpoints.batch.mockClear();
    jest.clearAllMocks();
  });

  it("tracking sends batches of events to api.segment.io", async () => {
    await waitFor(() => expect(endpoints.batch).toHaveBeenCalled());
  });

  it("identifies the user", async () => {
    await waitFor(async () =>
      expect(await endpoints.batch.mock.calls[0][0].request.json()).toMatchObject({
        batch: expect.arrayContaining([
          expect.objectContaining({
            type: "identify",
            userId: expect.any(String),
          }),
        ]),
      }),
    );
  });

  it("configures @shared/analytics to send events to api.segment.io", async () => {
    await track("Example event");

    await waitFor(
      async () => {
        await flush();
        const events = (
          await Promise.all(endpoints.batch.mock.calls.map(call => call[0].request.clone().json()))
        ).flatMap(body => body.batch ?? []);

        expect(events).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              type: "track",
              event: "Example event",
            }),
          ]),
        );
      },
      { timeout: 10_000 },
    );
  });
});
