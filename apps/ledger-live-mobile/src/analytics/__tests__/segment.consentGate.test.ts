import { track } from "@shared/analytics";
import { configureStore } from "@reduxjs/toolkit";
import reducers, { type AppStore } from "~/reducers";
import * as segment from "../segment";

jest.unmock("../segment");
jest.unmock("@shared/analytics");

const { _trackMock: mockTrack } = require("@segment/analytics-react-native") as {
  _trackMock: jest.Mock;
};

const OPTIONAL_EVENT = "button_clicked";
const OPTIONAL_PROPERTIES = { source: "portfolio" };
const MANDATORY_EVENT = "error_message";
const MANDATORY_PROPERTIES = { message: "sync_failed" };

const makeStore = (): AppStore =>
  configureStore({
    reducer: reducers,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }),
  }) as AppStore;

const startWithConsentRefused = async () => {
  const store = makeStore();
  expect(store.getState().settings.analyticsEnabled).toBe(false);
  expect(store.getState().settings.personalizedRecommendationsEnabled).toBe(false);

  await segment.start(store);
  mockTrack.mockClear();
};

describe("segment consent gate", () => {
  beforeEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useFakeTimers();
  });

  it("should not emit an optional event when analytics consent is refused", async () => {
    await startWithConsentRefused();

    await track(OPTIONAL_EVENT, OPTIONAL_PROPERTIES);

    expect(mockTrack).not.toHaveBeenCalled();
  });

  it("should emit a mandatory event once when analytics consent is refused", async () => {
    await startWithConsentRefused();

    await track(MANDATORY_EVENT, MANDATORY_PROPERTIES, { mandatory: true });

    expect(mockTrack).toHaveBeenCalledTimes(1);
    expect(mockTrack).toHaveBeenCalledWith(
      MANDATORY_EVENT,
      expect.objectContaining({
        ...MANDATORY_PROPERTIES,
        optInAnalytics: false,
        optInPersonalRecommendations: false,
      }),
    );
  });
});
