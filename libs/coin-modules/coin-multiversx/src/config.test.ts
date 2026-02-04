import { setCoinConfig, getCoinConfig, MultiversXCoinConfig } from "./config";

describe("config", () => {
  beforeEach(() => {
    // Reset config between tests
    setCoinConfig(undefined as any);
  });

  describe("setCoinConfig", () => {
    it("sets the coin config", () => {
      const mockConfig: MultiversXCoinConfig = () => ({
        config_currency_multiversx: {
          type: "object",
          default: {
            status: {
              type: "active",
            },
          },
        },
      });

      setCoinConfig(mockConfig);

      const result = getCoinConfig();
      expect(result.config_currency_multiversx).toBeDefined();
    });
  });

  describe("getCoinConfig", () => {
    it("throws error when config is not set", () => {
      expect(() => getCoinConfig()).toThrow("MultiversX module config not set");
    });

    it("throws error when config returns undefined", () => {
      setCoinConfig((() => undefined) as any);

      expect(() => getCoinConfig()).toThrow("MultiversX module config not set");
    });

    it("returns the config when set", () => {
      const mockConfig: MultiversXCoinConfig = () => ({
        config_currency_multiversx: {
          type: "object",
          default: {
            status: {
              type: "active",
            },
          },
        },
      });

      setCoinConfig(mockConfig);

      const result = getCoinConfig();
      expect(result.config_currency_multiversx.type).toBe("object");
      expect(result.config_currency_multiversx.default.status.type).toBe("active");
    });

    it("calls config function on each getCoinConfig call", () => {
      let callCount = 0;
      const mockConfig: MultiversXCoinConfig = () => {
        callCount++;
        return {
          config_currency_multiversx: {
            type: "object",
            default: {
              status: {
                type: "active",
              },
            },
          },
        };
      };

      setCoinConfig(mockConfig);
      callCount = 0; // Reset after setting

      getCoinConfig();
      const countAfterFirst = callCount;
      
      getCoinConfig();
      const countAfterSecond = callCount;

      // Each getCoinConfig call should invoke the config function
      // (may be called multiple times due to internal checks)
      expect(countAfterSecond).toBeGreaterThan(countAfterFirst);
    });
  });
});
