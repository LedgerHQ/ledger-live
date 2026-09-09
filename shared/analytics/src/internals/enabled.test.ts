import { isEnabled } from "./enabled";
import { getAnalyticsState, getIsTrackingEnabledSelector } from "../registry";

jest.mock("../registry", () => ({
  getAnalyticsState: jest.fn(() => ({})),
  getIsTrackingEnabledSelector: jest.fn(),
}));

describe("isEnabled", () => {
  it("tracking is disabled by default", () => {
    expect(isEnabled()).toEqual(false);
  });

  it("tracking is enabled when the store selector returns true", () => {
    jest.mocked(getIsTrackingEnabledSelector).mockReturnValueOnce(() => true);
    expect(isEnabled()).toEqual(true);
  });

  it("tracking is disabled when the store selector returns false", () => {
    jest.mocked(getIsTrackingEnabledSelector).mockReturnValueOnce(() => false);
    expect(isEnabled()).toEqual(false);
  });

  it("tracking is disabled when the store selector is not set", () => {
    jest.mocked(getIsTrackingEnabledSelector).mockReturnValueOnce(undefined);
    expect(isEnabled()).toEqual(false);
  });

  it("tracking is disabled when the store is not set", () => {
    jest.mocked(getAnalyticsState).mockReturnValueOnce(undefined);
    expect(isEnabled()).toEqual(false);
  });
});
