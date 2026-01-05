import {
  cryptoBannerReducer,
  toggleBanner,
  setAutoScroll,
  setScrollSpeed,
} from "./cryptoBannerSlice";

describe("cryptoBannerSlice", () => {
  const initialState = {
    isEnabled: true,
    autoScroll: true,
    scrollSpeed: 50,
  };

  it("should return the initial state", () => {
    expect(cryptoBannerReducer(undefined, { type: "unknown" })).toEqual(initialState);
  });

  it("should toggle banner", () => {
    const actual = cryptoBannerReducer(initialState, toggleBanner());
    expect(actual.isEnabled).toEqual(false);
  });

  it("should set auto scroll", () => {
    const actual = cryptoBannerReducer(initialState, setAutoScroll(false));
    expect(actual.autoScroll).toEqual(false);
  });

  it("should set scroll speed", () => {
    const actual = cryptoBannerReducer(initialState, setScrollSpeed(100));
    expect(actual.scrollSpeed).toEqual(100);
  });
});
