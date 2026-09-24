import { fetchContentAbTests, readCachedContentAbTests } from "~/firebase/contentAbTests";
import { fetchRemoteFlags, readCachedFlags } from "~/firebase/remoteConfig";
import customCreateStore from "./configureStore";

jest.mock("~/firebase/remoteConfig", () => ({
  fetchRemoteFlags: jest.fn(() => Promise.resolve({})),
  readCachedFlags: jest.fn(() => Promise.resolve({})),
}));

jest.mock("~/firebase/contentAbTests", () => ({
  fetchContentAbTests: jest.fn(() => Promise.resolve({})),
  readCachedContentAbTests: jest.fn(() => Promise.resolve({})),
}));

// Drains the middleware's prime-then-poll chain, which awaits the cache read before the fetch.
const flushPromises = async () => {
  for (let i = 0; i < 5; i++) await Promise.resolve();
};

describe("customCreateStore content A/B wiring", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("reads and fetches the content A/B payloads alongside the remote flags on boot", async () => {
    customCreateStore({});

    await flushPromises();

    expect(readCachedFlags).toHaveBeenCalledTimes(1);
    expect(readCachedContentAbTests).toHaveBeenCalledTimes(1);
    expect(fetchRemoteFlags).toHaveBeenCalledTimes(1);
    expect(fetchContentAbTests).toHaveBeenCalledTimes(1);
  });

  it("opts out of the content A/B reads when the remote flag fetcher is disabled", async () => {
    customCreateStore({ fetchRemoteFlags: null });

    await flushPromises();

    expect(readCachedContentAbTests).not.toHaveBeenCalled();
    expect(fetchContentAbTests).not.toHaveBeenCalled();
  });

  it("still fetches content A/B when a custom remote-flags fetcher is injected", async () => {
    const injectedFetch = jest.fn(() => Promise.resolve({}));
    customCreateStore({ fetchRemoteFlags: injectedFetch, readCachedFlags: null });

    await flushPromises();

    expect(injectedFetch).toHaveBeenCalledTimes(1);
    expect(fetchContentAbTests).toHaveBeenCalledTimes(1);
    expect(fetchRemoteFlags).not.toHaveBeenCalled();
  });
});
