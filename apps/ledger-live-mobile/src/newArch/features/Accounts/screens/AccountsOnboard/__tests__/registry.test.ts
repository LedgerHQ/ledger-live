/* eslint-disable @typescript-eslint/consistent-type-assertions */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getOnboardingConfig, getOnboardingBridge, hasOnboarding } from "../registry";
import { getCantonBridge } from "../adapters/canton";

jest.mock("../adapters/canton", () => ({
  getCantonBridge: jest.fn(),
  createCantonOnboardingBridge: jest.fn(_bridge => ({
    onboardAccount: jest.fn(),
  })),
  cantonOnboardingConfig: {
    stepComponents: {
      ONBOARD: jest.fn(),
      FINISH: jest.fn(),
    },
    footerComponents: {
      ONBOARD: jest.fn(),
      FINISH: jest.fn(),
    },
    translationKeys: {},
    urls: {},
    stepFlow: ["ONBOARD", "FINISH"],
  },
}));

describe("Registry", () => {
  const mockCantonCurrency = {
    type: "CryptoCurrency",
    id: "canton_network",
    ticker: "CANTON",
    name: "Canton Network",
    family: "canton",
    units: [],
    signatureScheme: "ed25519",
    color: "#000000",
    managerAppName: "Canton",
    coinType: 60,
    scheme: "canton",
    explorerViews: [],
  } as any as CryptoCurrency;

  const mockUnsupportedCurrency = {
    type: "CryptoCurrency",
    id: "bitcoin",
    ticker: "BTC",
    name: "Bitcoin",
    family: "bitcoin",
    units: [],
    signatureScheme: "ecdsa",
    color: "#000000",
    managerAppName: "Bitcoin",
    coinType: 0,
    scheme: "bitcoin",
    explorerViews: [],
  } as any as CryptoCurrency;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("hasOnboarding", () => {
    it("should return true for Canton currency", () => {
      expect(hasOnboarding(mockCantonCurrency)).toBe(true);
    });

    it("should return false for unsupported currency", () => {
      expect(hasOnboarding(mockUnsupportedCurrency)).toBe(false);
    });
  });

  describe("getOnboardingConfig", () => {
    it("should return Canton config for Canton currency", () => {
      const config = getOnboardingConfig(mockCantonCurrency);
      expect(config).toBeDefined();
      expect(config?.stepFlow).toEqual(["ONBOARD", "FINISH"]);
    });

    it("should return null for unsupported currency", () => {
      const config = getOnboardingConfig(mockUnsupportedCurrency);
      expect(config).toBeNull();
    });
  });

  describe("getOnboardingBridge", () => {
    it("should return bridge for Canton currency when bridge exists", () => {
      const mockBridge = {
        onboardAccount: jest.fn(),
      };

      (getCantonBridge as any).mockReturnValue(mockBridge);

      const bridge = getOnboardingBridge(mockCantonCurrency);
      expect(bridge).toBeDefined();
      expect(getCantonBridge).toHaveBeenCalledWith(mockCantonCurrency);
    });

    it("should return null when Canton bridge is not available", () => {
      (getCantonBridge as any).mockReturnValue(null);

      const bridge = getOnboardingBridge(mockCantonCurrency);
      expect(bridge).toBeNull();
    });

    it("should return null for unsupported currency", () => {
      const bridge = getOnboardingBridge(mockUnsupportedCurrency);
      expect(bridge).toBeNull();
    });
  });
});
