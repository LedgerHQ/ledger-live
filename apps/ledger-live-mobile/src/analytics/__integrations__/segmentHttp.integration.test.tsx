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
// SDK (POSTs to /v1/b) so MSW can observe HTTP; flushAt: 1 so one event is enough to flush.
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

const withTrackingEnabled =
  (enabled: boolean) =>
  (state: State): State => ({
    ...state,
    identities: { ...state.identities, userId: REAL_USER_ID },
    settings: {
      ...state.settings,
      analyticsEnabled: enabled,
      personalizedRecommendationsEnabled: false,
    },
  });

const endpoints = {
  batch: jest.fn().mockReturnValue(HttpResponse.json({ success: true })),
};

const startAnalyticsWithTracking = async (enabled: boolean) => {
  const { store } = render(<></>, {
    overrideInitialState: withTrackingEnabled(enabled),
  });
  await startAnalytics(store);
  return store;
};

const collectedBatchEvents = async () => {
  const bodies = await Promise.all(
    endpoints.batch.mock.calls.map(call => call[0].request.clone().json()),
  );
  return bodies.flatMap(body => body.batch ?? []);
};

describe("integration with segment.io", () => {
  beforeEach(() => {
    jest.useRealTimers();
    endpoints.batch.mockClear();
    jest.clearAllMocks();
    server.use(
      http.post("https://api.segment.io/v1/b", endpoints.batch),
      http.get("https://cdn-settings.segment.com/v1/projects/:writeKey/settings", () =>
        HttpResponse.json({ integrations: { "Segment.io": {} } }),
      ),
    );
  });

  afterEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  it("configures @shared/analytics to use Segment", async () => {
    await startAnalyticsWithTracking(true);

    await track("Example event");

    await waitFor(
      async () => {
        await flush();
        const events = await collectedBatchEvents();
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

  it("sends tracking events in batches to Segment's API", async () => {
    await startAnalyticsWithTracking(true);

    await waitFor(
      async () => {
        await flush();
        expect(endpoints.batch).toHaveBeenCalled();
        const bodies = await Promise.all(
          endpoints.batch.mock.calls.map(call => call[0].request.clone().json()),
        );
        expect(bodies.some(body => Array.isArray(body.batch) && body.batch.length > 0)).toBe(true);
      },
      { timeout: 10_000 },
    );
  });

  it("identifies the user when tracking is enabled", async () => {
    await startAnalyticsWithTracking(true);

    await waitFor(
      async () => {
        await flush();
        const events = await collectedBatchEvents();
        expect(events).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              type: "identify",
              userId: expect.any(String),
            }),
          ]),
        );
      },
      { timeout: 10_000 },
    );
  });

  it("does not identify the user when tracking is not enabled", async () => {
    await startAnalyticsWithTracking(false);
    await flush();

    await waitFor(async () => {
      const events = await collectedBatchEvents();
      expect(events.some(event => event.type === "identify")).toBe(false);
    });
  });
});
