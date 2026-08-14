import { waitFor } from "@testing-library/react-native";
import { EventType, type SegmentEvent } from "@segment/analytics-react-native";
import { UserId } from "@domain/entity-client-identity";
import { setAnalytics, setAnalyticsConsentInfo } from "~/actions/settings";
import { createStore, withFlagOverrides } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import * as segment from "../segment";
import { BrazePlugin } from "../BrazePlugin";
import { UserIdPlugin } from "../UserIdPlugin";
import { shouldIncludeSegmentIdentity } from "../segmentIdentity";

jest.unmock("../segment");

const { _identifyMock: mockIdentify, _trackMock: mockTrack } =
  require("@segment/analytics-react-native") as {
    _identifyMock: jest.Mock;
    _trackMock: jest.Mock;
  };

const REAL_USER_ID = UserId.fromString("11111111-1111-1111-1111-111111111111");
const ANALYTICS_USER_ID = REAL_USER_ID.exportUserIdForAnalytics();

const analyticsConsentInfo = {
  consentDate: "2026-04-29T00:00:00.000Z",
  privacyPolicyVersion: 1,
};

const withRealUserId =
  (analyticsEnabled: boolean) =>
  (state: State): State => ({
    ...state,
    identities: { ...state.identities, userId: REAL_USER_ID },
    settings: {
      ...state.settings,
      analyticsEnabled,
      personalizedRecommendationsEnabled: false,
    },
  });

const makeStore = (analyticsEnabled: boolean, brazeOptOutIdentityCleanup: boolean) =>
  createStore({
    overrideInitialState: withFlagOverrides(
      brazeOptOutIdentityCleanup ? { brazeOptOutIdentityCleanup: { enabled: true } } : {},
      withRealUserId(analyticsEnabled),
    ),
  });

describe("segment identity isolation (LIVE-34720)", () => {
  beforeEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useFakeTimers();
  });

  describe("shouldIncludeSegmentIdentity", () => {
    it("returns true when flag is off regardless of consent", () => {
      const store = makeStore(false, false);
      expect(shouldIncludeSegmentIdentity(store.getState())).toBe(true);
    });

    it("returns false when flag is on and tracking is disabled", () => {
      const store = makeStore(false, true);
      expect(shouldIncludeSegmentIdentity(store.getState())).toBe(false);
    });

    it("returns true when flag is on and analytics is enabled", () => {
      const store = makeStore(true, true);
      expect(shouldIncludeSegmentIdentity(store.getState())).toBe(true);
    });
  });

  describe("when brazeOptOutIdentityCleanup is on", () => {
    let store: ReturnType<typeof makeStore>;

    beforeEach(() => {
      store = makeStore(false, true);
      store.dispatch(setAnalyticsConsentInfo(analyticsConsentInfo));
    });

    it("updateIdentify(mandatory) omits identity traits when opted out", async () => {
      await segment.start(store);
      mockIdentify.mockClear();

      await segment.updateIdentify(undefined, true);

      await waitFor(() => expect(mockIdentify).toHaveBeenCalled());
      const [segmentUserId, traits] = mockIdentify.mock.calls.at(-1)!;
      expect(segmentUserId).toBeUndefined();
      expect(traits).not.toHaveProperty("userId");
      expect(traits).not.toHaveProperty("braze_external_id");
      expect(traits).toMatchObject({
        optInAnalytics: false,
        optInPersonalRecommendations: false,
      });
    });

    it("track(mandatory) omits identity traits when opted out", async () => {
      await segment.start(store);
      mockTrack.mockClear();

      segment.track("ConsentToggle", {}, true);

      await waitFor(() => expect(mockTrack).toHaveBeenCalled());
      const [, properties] = mockTrack.mock.calls.at(-1)!;
      expect(properties).not.toHaveProperty("userId");
      expect(properties).not.toHaveProperty("braze_external_id");
      expect(properties).toMatchObject({ optInAnalytics: false });
    });

    it("updateIdentify includes identity when analytics is enabled", async () => {
      store.dispatch(setAnalytics(true));
      await segment.start(store);
      mockIdentify.mockClear();

      await segment.updateIdentify(undefined, true);

      await waitFor(() => expect(mockIdentify).toHaveBeenCalled());
      const [segmentUserId, traits] = mockIdentify.mock.calls.at(-1)!;
      expect(segmentUserId).toBe(ANALYTICS_USER_ID);
      expect(traits).toMatchObject({
        userId: ANALYTICS_USER_ID,
        braze_external_id: ANALYTICS_USER_ID,
      });
    });
  });

  describe("when brazeOptOutIdentityCleanup is off (legacy)", () => {
    it("updateIdentify(mandatory) still includes identity when opted out", async () => {
      const store = makeStore(false, false);
      store.dispatch(setAnalyticsConsentInfo(analyticsConsentInfo));
      await segment.start(store);
      mockIdentify.mockClear();

      await segment.updateIdentify(undefined, true);

      await waitFor(() => expect(mockIdentify).toHaveBeenCalled());
      const [segmentUserId, traits] = mockIdentify.mock.calls.at(-1)!;
      expect(segmentUserId).toBe(ANALYTICS_USER_ID);
      expect(traits).toMatchObject({
        userId: ANALYTICS_USER_ID,
        braze_external_id: ANALYTICS_USER_ID,
      });
    });
  });

  describe("UserIdPlugin", () => {
    it("does not inject userId on events when identity is isolated", () => {
      const store = makeStore(false, true);
      const plugin = new UserIdPlugin(store);
      const event = { type: EventType.TrackEvent, event: "Test" } as SegmentEvent;

      const result = plugin.execute(event);

      expect(result?.userId).toBeUndefined();
    });

    it("injects userId on events when analytics is enabled", () => {
      const store = makeStore(true, true);
      const plugin = new UserIdPlugin(store);
      const event = { type: EventType.TrackEvent, event: "Test" } as SegmentEvent;

      const result = plugin.execute(event);

      expect(result?.userId).toBe(ANALYTICS_USER_ID);
    });
  });

  describe("BrazePlugin", () => {
    it("disables Braze integration when braze_external_id is absent from traits", () => {
      const plugin = new BrazePlugin();
      const event = {
        type: EventType.IdentifyEvent,
        traits: { optInAnalytics: false },
      } as SegmentEvent;

      const result = plugin.execute(event);

      expect(result?.integrations?.Appboy).toBe(false);
    });

    it("does not disable Braze integration when braze_external_id is present", () => {
      const plugin = new BrazePlugin();
      const event = {
        type: EventType.IdentifyEvent,
        traits: { braze_external_id: ANALYTICS_USER_ID, optInAnalytics: true },
      } as SegmentEvent;

      const result = plugin.execute(event);

      expect(result?.integrations?.Appboy).not.toBe(false);
    });
  });
});
