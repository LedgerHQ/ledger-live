import { configureStore, type UnknownAction } from "@reduxjs/toolkit";
import { startCountervaluesSync } from "@features/platform-market-countervalues";
import { featureFlagsReducer, setRemoteFlagsReady } from "@shared/feature-flags";
import { startCountervaluesWhenReady } from "./startCountervaluesWhenReady";

const savedState = { status: {} };

function createStore() {
  const store = configureStore({ reducer: { featureFlags: featureFlagsReducer } });
  const subscriptions = { active: 0 };
  const starts: UnknownAction[] = [];
  return {
    store,
    subscriptions,
    starts,
    appStore: {
      getState: store.getState,
      dispatch: <A extends UnknownAction>(action: A): A => {
        if (startCountervaluesSync.match(action)) starts.push(action);
        return store.dispatch(action);
      },
      subscribe: (listener: () => void) => {
        subscriptions.active++;
        const release = store.subscribe(listener);
        let released = false;
        return () => {
          if (!released) subscriptions.active--;
          released = true;
          release();
        };
      },
    },
  };
}

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(res => {
    resolve = res;
  });
  return { promise, resolve };
}

describe("startCountervaluesWhenReady", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("starts once the currencies are hydrated and the remote flags ready", async () => {
    const { store, appStore, starts } = createStore();
    const currencies = deferred();

    void startCountervaluesWhenReady(appStore, savedState, currencies.promise);
    store.dispatch(setRemoteFlagsReady());
    await jest.advanceTimersByTimeAsync(0);
    expect(starts).toHaveLength(0);

    currencies.resolve();
    await jest.advanceTimersByTimeAsync(0);

    expect(starts).toEqual([startCountervaluesSync({ savedState })]);
  });

  it("waits for the remote flags when the currencies are hydrated first", async () => {
    const { store, appStore, starts } = createStore();

    void startCountervaluesWhenReady(appStore, savedState, Promise.resolve());
    await jest.advanceTimersByTimeAsync(0);
    expect(starts).toHaveLength(0);

    store.dispatch(setRemoteFlagsReady());
    await jest.advanceTimersByTimeAsync(0);

    expect(starts).toHaveLength(1);
  });

  it("counts a failed hydration as hydrated", async () => {
    const { store, appStore, starts } = createStore();
    store.dispatch(setRemoteFlagsReady());

    void startCountervaluesWhenReady(appStore, savedState, Promise.reject(new Error("hydration")));
    await jest.advanceTimersByTimeAsync(0);

    expect(starts).toHaveLength(1);
  });

  it("clears its timer and its subscription when readiness wins", async () => {
    const { store, appStore, subscriptions } = createStore();
    store.dispatch(setRemoteFlagsReady());

    await startCountervaluesWhenReady(appStore, savedState, Promise.resolve());

    expect(jest.getTimerCount()).toBe(0);
    expect(subscriptions.active).toBe(0);
  });

  it("starts after a second and releases its subscription when the timeout wins", async () => {
    const { appStore, subscriptions, starts } = createStore();

    void startCountervaluesWhenReady(appStore, savedState, Promise.resolve());
    await jest.advanceTimersByTimeAsync(999);
    expect(starts).toHaveLength(0);
    expect(subscriptions.active).toBe(1);

    await jest.advanceTimersByTimeAsync(1);

    expect(starts).toHaveLength(1);
    expect(subscriptions.active).toBe(0);
  });

  it("starts only once when the flags turn ready after the timeout", async () => {
    const { store, appStore, starts } = createStore();

    void startCountervaluesWhenReady(appStore, savedState, Promise.resolve());
    await jest.advanceTimersByTimeAsync(1_000);
    store.dispatch(setRemoteFlagsReady());
    await jest.advanceTimersByTimeAsync(0);

    expect(starts).toHaveLength(1);
  });
});
