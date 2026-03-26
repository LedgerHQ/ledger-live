import RNLocalize from "react-native-localize";
import {
  getCountryLocale,
  getEarnOrYieldSuffix,
  getStakeLabelLocaleBased,
} from "../getStakeLabelLocaleBased";

jest.mock("react-native-localize", () => ({
  getCountry: jest.fn(() => "US"),
}));

const mockGetCountry = jest.mocked(RNLocalize.getCountry);

describe("getStakeLabelLocaleBased", () => {
  beforeEach(() => {
    mockGetCountry.mockReturnValue("US");
  });

  describe("getCountryLocale", () => {
    it("should delegate to RNLocalize.getCountry", () => {
      mockGetCountry.mockReturnValue("FR");
      expect(getCountryLocale()).toBe("FR");
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
