jest.unmock("@shared/analytics");
jest.unmock("../segment");
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

import { http, HttpResponse } from "msw";
import { waitFor } from "tests/testSetup";
import { server } from "tests/server";
import createStore from "~/state-manager/configureStore";
import type { State } from "~/renderer/reducers";
import { INITIAL_STATE as SETTINGS_INITIAL_STATE } from "~/renderer/reducers/settings";
import { track } from "@shared/analytics";
import { startAnalytics } from "../segment";

process.env.SEGMENT_TEST = "true";

const createStoreWithTracking = (enabled: boolean) =>
  createStore({
    state: {
      settings: {
        ...SETTINGS_INITIAL_STATE,
        shareAnalytics: enabled,
        sharePersonalizedRecommandations: false,
      },
    } as State,
    fetchRemoteFlags: null,
  });

const startAnalyticsWithTracking = async (enabled: boolean) => {
  const store = createStoreWithTracking(enabled);
  await startAnalytics(store);
  return store;
};

const endpoints = {
  track: jest.fn().mockReturnValue(HttpResponse.json({ success: true })),
  identify: jest.fn().mockReturnValue(HttpResponse.json({ success: true })),
};

const collectedTrackBodies = async () =>
  Promise.all(endpoints.track.mock.calls.map(call => call[0].request.clone().json()));

const collectedIdentifyBodies = async () =>
  Promise.all(endpoints.identify.mock.calls.map(call => call[0].request.clone().json()));

describe("integration with segment.io", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    server.use(
      http.post("https://api.segment.io/v1/t", endpoints.track),
      http.post("https://api.segment.io/v1/i", endpoints.identify),
      http.all("https://cdn.segment.com/:path*", () => HttpResponse.json({})),
    );
  });

  it("configures @shared/analytics to use Segment", async () => {
    await startAnalyticsWithTracking(true);

    await track("Example event");

    await waitFor(async () => {
      const bodies = await collectedTrackBodies();
      expect(bodies).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            event: "Example event",
            userId: expect.any(String),
          }),
        ]),
      );
    });
  });

  it("sends tracking events in batches to Segment's API", async () => {
    await startAnalyticsWithTracking(true);

    await track("Batch contract event");

    await waitFor(async () => {
      expect(endpoints.track).toHaveBeenCalled();
      const bodies = await collectedTrackBodies();
      expect(bodies.length).toBeGreaterThan(0);
      expect(bodies[0]).toEqual(
        expect.objectContaining({
          event: expect.any(String),
        }),
      );
    });
  });

  it("identifies the user when tracking is enabled", async () => {
    await startAnalyticsWithTracking(true);

    await waitFor(async () => {
      const bodies = await collectedIdentifyBodies();
      expect(bodies).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            userId: expect.any(String),
          }),
        ]),
      );
    });
  });

  it("does not identify the user when tracking is not enabled", async () => {
    await startAnalyticsWithTracking(false);

    expect(endpoints.identify).not.toHaveBeenCalled();
  });
});
