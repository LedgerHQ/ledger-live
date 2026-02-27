/**
 * Tests for readOnlyMode analytics: identify includes readOnlyMode,
 * and identify is called again when readOnlyMode changes (store.subscribe).
 */
import { configureStore } from "@reduxjs/toolkit";
import reducers from "~/reducers";
import type { AppStore } from "~/reducers";
import { setReadOnlyMode } from "~/actions/settings";
import * as segment from "../segment";

jest.unmock("../segment");

const { _identifyMock: mockIdentify } = require("@segment/analytics-react-native") as {
  _identifyMock: jest.Mock;
};
const MOCK_USER_ID = "test-user-id";

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

  it("calls identify when start(store) runs and again when readOnlyMode changes via store.subscribe", async () => {
    await segment.start(store);

    expect(mockIdentify).toHaveBeenCalledTimes(1);
    expect(mockIdentify).toHaveBeenLastCalledWith(
      MOCK_USER_ID,
      expect.objectContaining({ readOnlyMode: true }),
    );

    store.dispatch(setReadOnlyMode(false));
    await flushAsync();

    expect(mockIdentify).toHaveBeenCalledTimes(2);
    expect(mockIdentify).toHaveBeenLastCalledWith(
      MOCK_USER_ID,
      expect.objectContaining({ readOnlyMode: false }),
    );

    store.dispatch(setReadOnlyMode(true));
    await flushAsync();

    expect(mockIdentify).toHaveBeenCalledTimes(3);
    expect(mockIdentify).toHaveBeenLastCalledWith(
      MOCK_USER_ID,
      expect.objectContaining({ readOnlyMode: true }),
    );
  });

  it("does not call identify again when readOnlyMode value does not change", async () => {
    await segment.start(store);

    expect(mockIdentify).toHaveBeenCalledTimes(1);

    store.dispatch(setReadOnlyMode(true));
    await flushAsync();

    expect(mockIdentify).toHaveBeenCalledTimes(1);

    store.dispatch(setReadOnlyMode(false));
    store.dispatch(setReadOnlyMode(false));
    await flushAsync();

    expect(mockIdentify).toHaveBeenCalledTimes(2);
  });
});
