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

import React from "react";
import { http, HttpResponse } from "msw";
import { render, waitFor } from "tests/testSetup";
import { server } from "tests/server";
import createStore from "~/state-manager/configureStore";
import type { State } from "~/renderer/reducers";
import { INITIAL_STATE as SETTINGS_INITIAL_STATE } from "~/renderer/reducers/settings";
import TrackPage from "../TrackPage";
import { startAnalytics } from "../segment";

process.env.SEGMENT_TEST = "true";

const createStoreWithAnalytics = () =>
  createStore({
    state: {
      settings: {
        ...SETTINGS_INITIAL_STATE,
        shareAnalytics: true,
        sharePersonalizedRecommandations: false,
      },
    } as State,
    fetchRemoteFlags: null,
  });

const endpoints = {
  track: jest.fn().mockReturnValue(HttpResponse.json({ success: true })),
};

describe("Segment integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    server.use(
      http.post("https://api.segment.io/v1/t", endpoints.track),
      http.all("https://cdn.segment.com/:path*", () => HttpResponse.json({})),
    );
  });

  it("should call api.segment.io when when tracking", async () => {
    const store = createStoreWithAnalytics();
    await startAnalytics(store);
    endpoints.track.mockClear();

    render(<TrackPage category="Settings" name="General" />, { store });

    await waitFor(() => expect(endpoints.track).toHaveBeenCalled());
    expect(await endpoints.track.mock.calls[0][0].request.json()).toMatchObject({
      userId: expect.any(String),
    });
  });
});
