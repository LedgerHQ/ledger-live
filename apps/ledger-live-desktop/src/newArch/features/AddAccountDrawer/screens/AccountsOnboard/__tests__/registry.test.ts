/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import {
  getOnboardingBridge,
  getOnboardingConfig,
  hasOnboarding,
  onboardingBridgeResolvers,
  onboardingConfigs,
  validateOnboardingConfig,
} from "../registry";
import { OnboardingBridge, OnboardingConfig, StepId } from "../types";

describe("Onboarding Registry", () => {
  const mockCurrency = {
    id: "test_currency",
    name: "Test Currency",
    family: "test",
    ticker: "TEST",
    scheme: "test",
    color: "#000000",
    units: [],
    type: "CryptoCurrency",
  } as unknown as CryptoCurrency;

  const mockBridge: OnboardingBridge = {
    onboardAccount: jest.fn(),
  };

  const mockStepComponent = jest.fn(() => null);
  const mockFooterComponent = jest.fn(() => null);

  const mockConfig: OnboardingConfig = {
    stepComponents: {
      [StepId.ONBOARD]: mockStepComponent,
      [StepId.FINISH]: mockStepComponent,
    },
    footerComponents: {
      [StepId.ONBOARD]: mockFooterComponent,
      [StepId.FINISH]: mockFooterComponent,
    },
    translationKeys: {
      title: "test.title",
      reonboardTitle: "test.reonboardTitle",
      init: "test.init",
      reonboardInit: "test.reonboardInit",
      success: "test.success",
      reonboardSuccess: "test.reonboardSuccess",
      error: "test.error",
    },
    urls: {},
    stepFlow: [StepId.ONBOARD, StepId.FINISH],
  };

  beforeEach(() => {
    delete onboardingConfigs.test;
    delete onboardingBridgeResolvers.test;
  });

  describe("validateOnboardingConfig", () => {
    it("should not throw for valid config", () => {
      expect(() => {
        validateOnboardingConfig(mockConfig, "test");
      }).not.toThrow();
    });

    it("should throw error when stepFlow is missing ONBOARD step", () => {
      const invalidConfig = {
        ...mockConfig,
        stepFlow: [StepId.FINISH],
      };

      expect(() => {
        validateOnboardingConfig(invalidConfig, "test");
      }).toThrow("stepFlow must include ONBOARD");
    });

    it("should throw error when stepFlow is missing FINISH step", () => {
      const invalidConfig = {
        ...mockConfig,
        stepFlow: [StepId.ONBOARD],
      };

      expect(() => {
        validateOnboardingConfig(invalidConfig, "test");
      }).toThrow("stepFlow must include FINISH");
    });

    it("should throw error when stepComponent is missing for step in stepFlow", () => {
      const invalidConfig = {
        ...mockConfig,
        stepComponents: {
          [StepId.ONBOARD]: mockStepComponent,
          // Missing FINISH component
        },
      } as unknown as OnboardingConfig;

      expect(() => {
        validateOnboardingConfig(invalidConfig, "test");
      }).toThrow("stepComponents[FINISH] is missing");
    });

    it("should throw error when footerComponent is missing for step in stepFlow", () => {
      const invalidConfig = {
        ...mockConfig,
        footerComponents: {
          [StepId.ONBOARD]: mockFooterComponent,
          // Missing FINISH component
        },
      } as unknown as OnboardingConfig;

      expect(() => {
        validateOnboardingConfig(invalidConfig, "test");
      }).toThrow("footerComponents[FINISH] is missing");
    });
  });

  describe("getOnboardingConfig", () => {
    it("should return config for registered currency family", () => {
      onboardingConfigs.test = mockConfig;
      const config = getOnboardingConfig(mockCurrency);
      expect(config).toBe(mockConfig);
    });

    it("should return null for unregistered currency family", () => {
      const unregisteredCurrency = {
        ...mockCurrency,
        family: "unregistered",
      };
      const config = getOnboardingConfig(unregisteredCurrency);
      expect(config).toBeNull();
    });
  });

  describe("getOnboardingBridge", () => {
    it("should return bridge for registered currency family", () => {
      onboardingConfigs.test = mockConfig;
      onboardingBridgeResolvers.test = () => mockBridge;
      const bridge = getOnboardingBridge(mockCurrency);
      expect(bridge).toBe(mockBridge);
    });

    it("should return null for unregistered currency family", () => {
      const unregisteredCurrency = {
        ...mockCurrency,
        family: "unregistered",
      };
      const bridge = getOnboardingBridge(unregisteredCurrency);
      expect(bridge).toBeNull();
    });

    it("should call resolver function with currency", () => {
      const resolverSpy = jest.fn(() => mockBridge);
      onboardingConfigs.test = mockConfig;
      onboardingBridgeResolvers.test = resolverSpy;
      getOnboardingBridge(mockCurrency);
      expect(resolverSpy).toHaveBeenCalledWith(mockCurrency);
    });

    it("should return null when resolver returns null", () => {
      onboardingConfigs.test = mockConfig;
      onboardingBridgeResolvers.test = () => null;
      const bridge = getOnboardingBridge(mockCurrency);
      expect(bridge).toBeNull();
    });
  });

  describe("hasOnboarding", () => {
    it("should return true for registered currency family", () => {
      onboardingConfigs.test = mockConfig;
      expect(hasOnboarding(mockCurrency)).toBe(true);
    });

    it("should return false for unregistered currency family", () => {
      const unregisteredCurrency = {
        ...mockCurrency,
        family: "unregistered",
      };
      expect(hasOnboarding(unregisteredCurrency)).toBe(false);
    });
  });
});
