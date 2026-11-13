import { getDeviceRegion } from "@shared/device-locale";
import {
  getCountryLocale,
  getEarnOrYieldSuffix,
  getStakeLabelLocaleBased,
} from "../getStakeLabelLocaleBased";

jest.mock("@shared/device-locale", () => ({
  getDeviceRegion: jest.fn(() => "US"),
}));

const mockGetCountry = jest.mocked(getDeviceRegion);

describe("getStakeLabelLocaleBased", () => {
  beforeEach(() => {
    mockGetCountry.mockReturnValue("US");
  });

  describe("getCountryLocale", () => {
    it("should return the device region", () => {
      mockGetCountry.mockReturnValue("FR");
      expect(getCountryLocale()).toBe("FR");
    });

    it("should return an empty string when the device has no region", () => {
      mockGetCountry.mockReturnValue(undefined);
      expect(getCountryLocale()).toBe("");
    });
  });

  describe("getEarnOrYieldSuffix", () => {
    it('should return "yield" when locale is GB', () => {
      mockGetCountry.mockReturnValue("GB");
      expect(getEarnOrYieldSuffix()).toBe("yield");
    });

    it.each(["US", "FR", "DE", "JP"])('should return "earn" when locale is %s', locale => {
      mockGetCountry.mockReturnValue(locale);
      expect(getEarnOrYieldSuffix()).toBe("earn");
    });
  });

  describe("getStakeLabelLocaleBased", () => {
    it('should return "account.yield" for GB users', () => {
      mockGetCountry.mockReturnValue("GB");
      expect(getStakeLabelLocaleBased()).toBe("account.yield");
    });

    it('should return "account.earn" for non-GB users', () => {
      mockGetCountry.mockReturnValue("US");
      expect(getStakeLabelLocaleBased()).toBe("account.earn");
    });
  });
});
