import { getIsTracking } from "./consent";
import { setTrackingSelector } from "./registry";

describe("getIsTracking", () => {
  afterEach(() => {
    setTrackingSelector(undefined);
  });

  it("enables tracking while no selector is registered, even without a state", () => {
    expect(getIsTracking(undefined)).toEqual({ enabled: true });
    expect(getIsTracking({ anything: true })).toEqual({ enabled: true });
  });

  it("reports an uninitialised store once a selector is registered", () => {
    setTrackingSelector(() => true);

    expect(getIsTracking(undefined)).toEqual({
      enabled: false,
      reason: "store not initialised",
    });
  });

  it("blocks a normal event when the selector refuses consent", () => {
    setTrackingSelector(() => false);

    expect(getIsTracking({}, false)).toEqual({
      enabled: false,
      reason: "analytics not enabled",
    });
  });

  it("lets a mandatory event through when the selector refuses consent", () => {
    setTrackingSelector(() => false);

    expect(getIsTracking({}, true)).toEqual({ enabled: true });
  });

  it("passes the state to the selector", () => {
    const trackingSelector = jest.fn(() => true);
    setTrackingSelector(trackingSelector);

    getIsTracking({ settings: { shareAnalytics: true } });

    expect(trackingSelector).toHaveBeenCalledWith({ settings: { shareAnalytics: true } });
  });
});
