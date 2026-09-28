import type { Store } from "redux";
import { isRevampedScheme, whenFlagsAnswered } from "./scheme";

type State = Parameters<typeof isRevampedScheme>[0];

const state = (
  overrides: Partial<{ remoteFlagsReady: boolean; revamp: boolean; stored: boolean }> = {},
): State => {
  const { remoteFlagsReady = true, revamp = false, stored = false } = overrides;

  return {
    appLock: {
      isHydrated: true,
      hasPassword: stored,
      biometricsEnabled: false,
      isLocked: false,
    },
    featureFlags: {
      remoteFlagsReady,
      resolved: { lwmPasswordRevamp: { enabled: revamp } },
      overrides: {},
    },
  } as unknown as State;
};

const fakeStore = (initial: State) => {
  let current = initial;
  const listeners = new Set<() => void>();

  return {
    getState: () => current,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    answer: (next: State) => {
      current = next;
      listeners.forEach(listener => listener());
    },
    listenerCount: () => listeners.size,
  } as unknown as Store<State> & { answer: (next: State) => void; listenerCount: () => number };
};

describe("waiting for the flags to answer", () => {
  it("does not wait at all once they have", async () => {
    await expect(whenFlagsAnswered(fakeStore(state()))).resolves.toBeUndefined();
  });

  it("waits for the answer rather than reading silence as a disabled flag", async () => {
    const store = fakeStore(state({ remoteFlagsReady: false }));
    let hasAnswered = false;

    const waiting = whenFlagsAnswered(store).then(() => {
      hasAnswered = true;
    });

    await Promise.resolve();
    expect(hasAnswered).toBe(false);

    store.answer(state({ remoteFlagsReady: true, revamp: true }));
    await waiting;

    expect(hasAnswered).toBe(true);
    // Left subscribed, every later dispatch would run this again for a promise already settled.
    expect(store.listenerCount()).toBe(0);
  });

  it("gives up rather than holding the caller for good when they never answer", async () => {
    jest.useFakeTimers();

    try {
      const store = fakeStore(state({ remoteFlagsReady: false }));
      const waiting = whenFlagsAnswered(store);

      jest.advanceTimersByTime(2_000);

      await expect(waiting).resolves.toBeUndefined();
      expect(store.listenerCount()).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe("reading the scheme from the store", () => {
  it("is revamped where the flag says so", () => {
    expect(isRevampedScheme(state({ revamp: true }))).toBe(true);
  });

  it("is revamped for stored protection whatever the flag says", () => {
    expect(isRevampedScheme(state({ revamp: false, stored: true }))).toBe(true);
  });

  it("is not revamped for a user with neither", () => {
    expect(isRevampedScheme(state())).toBe(false);
  });
});
