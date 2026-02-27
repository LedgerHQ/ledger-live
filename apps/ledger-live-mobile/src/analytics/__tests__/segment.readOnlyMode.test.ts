/**
 * Tests for readOnlyMode analytics: readOnlyMode is included in track()
 * extraProperties at runtime via getMandatoryProperties → readOnlyModeEnabledSelector(state).
 */
import { configureStore } from "@reduxjs/toolkit";
import reducers from "~/reducers";
import type { AppStore } from "~/reducers";
import { setReadOnlyMode } from "~/actions/settings";
import * as segment from "../segment";

jest.unmock("../segment");

const { _trackMock: mockTrack } = require("@segment/analytics-react-native") as {
  _trackMock: jest.Mock;
};

describe("segment readOnlyMode", () => {
  jest.setTimeout(15000);

  beforeAll(() => {
    jest.useRealTimers();
  });

  afterAll(() => {
    jest.useFakeTimers();
  });

  const makeStore = (): AppStore =>
    configureStore({
      reducer: reducers,
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware({
          serializableCheck: false,
          immutableCheck: false,
        }),
    }) as AppStore;

  let store: AppStore;

  beforeEach(() => {
    jest.clearAllMocks();
    store = makeStore();
  });

  const flushAsync = () =>
    Promise.resolve()
      .then(() => new Promise<void>(r => setImmediate(r)))
      .then(() => new Promise<void>(r => setImmediate(r)));

  it("track() includes readOnlyMode from state at runtime (default true)", async () => {
    await segment.start(store);
    mockTrack.mockClear();

    await segment.track("TestEvent", {});
    await flushAsync();

    expect(mockTrack).toHaveBeenCalledWith(
      "TestEvent",
      expect.objectContaining({ readOnlyMode: true }),
    );
  });

  it("track() includes readOnlyMode from state at runtime after setReadOnlyMode(false)", async () => {
    await segment.start(store);
    store.dispatch(setReadOnlyMode(false));
    await flushAsync();
    mockTrack.mockClear();

    await segment.track("TestEvent", {});
    await flushAsync();

    expect(mockTrack).toHaveBeenCalledWith(
      "TestEvent",
      expect.objectContaining({ readOnlyMode: false }),
    );
  });

  it("track() includes readOnlyMode from state at runtime after setReadOnlyMode(true)", async () => {
    await segment.start(store);
    store.dispatch(setReadOnlyMode(false));
    await flushAsync();
    store.dispatch(setReadOnlyMode(true));
    await flushAsync();
    mockTrack.mockClear();

    await segment.track("TestEvent", {});
    await flushAsync();

    expect(mockTrack).toHaveBeenCalledWith(
      "TestEvent",
      expect.objectContaining({ readOnlyMode: true }),
    );
  });
});
