jest.unmock("../segment");
jest.unmock("~/renderer/analytics/segment");
jest.unmock("src/renderer/analytics/segment");

const mockIdentify = jest.fn();

jest.mock("@segment/analytics-next", () => ({
  AnalyticsBrowser: {
    load: jest.fn(() => ({
      identify: mockIdentify,
      track: jest.fn(),
    })),
  },
}));

jest.mock("~/renderer/logger", () => ({
  __esModule: true,
  default: {
    analyticsPage: jest.fn(),
    analyticsStart: jest.fn(),
    analyticsTrack: jest.fn(),
    onReduxAction: jest.fn(),
  },
}));

import type { Subscription } from "rxjs";
import { waitFor } from "tests/testSetup";
import createStore from "~/state-manager/configureStore";
import type { State } from "~/renderer/reducers";
import { INITIAL_STATE as SETTINGS_INITIAL_STATE } from "~/renderer/reducers/settings";
import { startAnalytics, trackSubject, updateIdentify, type LoggableEvent } from "../segment";

const identifyOverlayEvent = {
  eventName: "[Identify]",
  eventProperties: { userIdPresent: expect.any(Boolean) },
  eventPropertiesWithoutExtra: { userIdPresent: expect.any(Boolean) },
};

const createStoreWithAnalytics = (shareAnalytics: boolean) =>
  createStore({
    state: {
      settings: {
        ...SETTINGS_INITIAL_STATE,
        shareAnalytics,
        sharePersonalizedRecommandations: false,
      },
    } as State,
    fetchRemoteFlags: null,
  });

describe("segment identify overlay (LIVE-35849)", () => {
  let logged: LoggableEvent[];
  let subscription: Subscription;

  beforeEach(() => {
    jest.clearAllMocks();
    logged = [];
    subscription = trackSubject.subscribe(event => logged.push(event));
    logged.length = 0;
  });

  afterEach(() => subscription.unsubscribe());

  it("should log [Identify] when analytics starts with tracking on", async () => {
    await startAnalytics(createStoreWithAnalytics(true));

    expect(mockIdentify).toHaveBeenCalled();
    await waitFor(() => expect(logged).toEqual([expect.objectContaining(identifyOverlayEvent)]));
  });

  it("should log [Identify] after updateIdentify when tracking is on and the client is ready", async () => {
    await startAnalytics(createStoreWithAnalytics(true));
    await waitFor(() => expect(logged.length).toBeGreaterThan(0));
    mockIdentify.mockClear();
    logged.length = 0;

    await updateIdentify();

    expect(mockIdentify).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(logged).toEqual([expect.objectContaining(identifyOverlayEvent)]));
  });

  it("should not log [Identify] when tracking is off and identify does not run", async () => {
    await startAnalytics(createStoreWithAnalytics(false));
    mockIdentify.mockClear();
    logged.length = 0;

    await updateIdentify();

    expect(mockIdentify).not.toHaveBeenCalled();
    expect(logged).toEqual([]);
  });

  it("should log [Identify] when updateIdentify is forced while tracking is off", async () => {
    await startAnalytics(createStoreWithAnalytics(false));
    mockIdentify.mockClear();
    logged.length = 0;

    await updateIdentify({ force: true });

    expect(mockIdentify).toHaveBeenCalled();
    await waitFor(() => expect(logged).toEqual([expect.objectContaining(identifyOverlayEvent)]));
  });

  it("should log [Identify] with failed when identify throws synchronously", async () => {
    await startAnalytics(createStoreWithAnalytics(true));
    await waitFor(() => expect(logged.length).toBeGreaterThan(0));
    mockIdentify.mockClear();
    logged.length = 0;
    mockIdentify.mockImplementationOnce(() => {
      throw new Error("sdk down");
    });

    await expect(updateIdentify()).resolves.toBeUndefined();

    expect(mockIdentify).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(logged).toEqual([
        expect.objectContaining({
          eventName: "[Identify]",
          eventProperties: { userIdPresent: expect.any(Boolean), failed: true },
          eventPropertiesWithoutExtra: { userIdPresent: expect.any(Boolean), failed: true },
        }),
      ]),
    );
  });

  it("should log [Identify] with failed when the Segment identify promise rejects", async () => {
    await startAnalytics(createStoreWithAnalytics(true));
    await waitFor(() => expect(logged.length).toBeGreaterThan(0));
    mockIdentify.mockClear();
    logged.length = 0;
    mockIdentify.mockRejectedValueOnce(new Error("sdk down"));

    await updateIdentify();

    expect(mockIdentify).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(logged).toEqual([
        expect.objectContaining({
          eventName: "[Identify]",
          eventProperties: { userIdPresent: expect.any(Boolean), failed: true },
          eventPropertiesWithoutExtra: { userIdPresent: expect.any(Boolean), failed: true },
        }),
      ]),
    );
  });
});
