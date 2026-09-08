import { isTrackingEnabled } from "./enabled";
import { getAnalyticsState, getIsTrackingEnabledSelector } from "../registry";

jest.mock("../registry", () => ({
  getAnalyticsState: jest.fn(() => ({})),
  getIsTrackingEnabledSelector: jest.fn(),
}));

describe("isTrackingEnabled", () => {
  it("tracking is disabled by default", () => {
    expect(isTrackingEnabled()).toEqual(false);
  });

  it("tracking is enabled when the store selector returns true", () => {
    jest.mocked(getIsTrackingEnabledSelector).mockReturnValueOnce(() => true);
    expect(isTrackingEnabled()).toEqual(true);
  });

  it("tracking is disabled when the store selector returns false", () => {
    jest.mocked(getIsTrackingEnabledSelector).mockReturnValueOnce(() => false);
    expect(isTrackingEnabled()).toEqual(false);
  });

  it("tracking is disabled when the store selector is not set", () => {
    jest.mocked(getIsTrackingEnabledSelector).mockReturnValueOnce(undefined);
    expect(isTrackingEnabled()).toEqual(false);
  });

  it("tracking is disabled when the store is not set", () => {
    jest.mocked(getAnalyticsState).mockReturnValueOnce(undefined);
    expect(isTrackingEnabled()).toEqual(false);
  });
});
