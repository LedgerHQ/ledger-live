/**
 * Tests for readOnlyMode analytics: readOnlyMode is included in track()
 * extraProperties at runtime via getMandatoryProperties → readOnlyModeEnabledSelector(state).
 */
import { waitFor } from "@testing-library/react-native";
import { configureStore } from "@reduxjs/toolkit";
import reducers from "~/reducers";
import type { AppStore } from "~/reducers";
import { setReadOnlyMode } from "~/actions/settings";
import * as segment from "../segment";

jest.unmock("../segment");

const { _trackMock: mockTrack } = require("@segment/analytics-react-native") as {
  _trackMock: jest.Mock;
};

const makeStore = (): AppStore =>
  configureStore({
    reducer: reducers,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
      }),
  }) as AppStore;

describe("segment readOnlyMode", () => {
  beforeEach(() => {
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.useFakeTimers();
  });

  let store: AppStore;

  beforeEach(() => {
    jest.clearAllMocks();
    store = makeStore();
  });

  it("track() includes readOnlyMode from state at runtime (default true)", async () => {
    await segment.start(store);
    mockTrack.mockClear();

    segment.track("TestEvent", {});

    await waitFor(() =>
      expect(mockTrack).toHaveBeenCalledWith(
        "TestEvent",
        expect.objectContaining({ readOnlyMode: true }),
      ),
    );
  });

  it("track() includes readOnlyMode from state at runtime after setReadOnlyMode(false)", async () => {
    await segment.start(store);
    store.dispatch(setReadOnlyMode(false));
    mockTrack.mockClear();

    segment.track("TestEvent", {});

    await waitFor(() =>
      expect(mockTrack).toHaveBeenCalledWith(
        "TestEvent",
        expect.objectContaining({ readOnlyMode: false }),
      ),
    );
  });

  it("track() includes readOnlyMode from state at runtime after setReadOnlyMode(true)", async () => {
    await segment.start(store);
    store.dispatch(setReadOnlyMode(false));
    store.dispatch(setReadOnlyMode(true));
    mockTrack.mockClear();

    segment.track("TestEvent", {});

    await waitFor(() =>
      expect(mockTrack).toHaveBeenCalledWith(
        "TestEvent",
        expect.objectContaining({ readOnlyMode: true }),
      ),
    );
  });
});
