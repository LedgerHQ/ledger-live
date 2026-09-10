import {
  applyPropertyFilter,
  getAnalytics,
  getEnabledFunction,
  resolveExtraProperties,
  setAnalytics,
  setEnabledFunction,
  setExtraPropertiesFunction,
  setMandatoryExtraPropertiesFunction,
  setPropertyFilter,
} from "./registry";
import type { AnalyticsTransport, Props } from "./types";

const transport = { track: jest.fn() } as AnalyticsTransport;

beforeEach(() => {
  setAnalytics({ track: jest.fn() });
  setEnabledFunction(undefined);
  setExtraPropertiesFunction(undefined);
  setMandatoryExtraPropertiesFunction(undefined);
  setPropertyFilter(undefined);
});

describe("@shared/analytics registry", () => {
  describe("consumers of @shared/analytics set their own interface", () => {
    it("round-trips analytics transport", () => {
      setAnalytics(transport);

      expect(getAnalytics()).toBe(transport);
    });

    it("round-trips enabled function", () => {
      const enabled = () => true;
      setEnabledFunction(enabled);

      expect(getEnabledFunction()).toBe(enabled);
    });

    it("clears enabled function when set to undefined", () => {
      setEnabledFunction(() => true);
      setEnabledFunction(undefined);

      expect(getEnabledFunction()).toBeUndefined();
    });
  });

  describe("resolveExtraProperties", () => {
    it("uses the extra properties function for non-mandatory events", () => {
      setExtraPropertiesFunction(() => ({ extra: "props" }));

      expect(resolveExtraProperties(false)).toEqual({ extra: "props" });
    });

    it("uses the mandatory extra properties function for mandatory events", () => {
      setMandatoryExtraPropertiesFunction(() => ({ mandatory: "props" }));

      expect(resolveExtraProperties(true)).toEqual({ mandatory: "props" });
    });

    it("returns undefined when no function is registered", () => {
      expect(resolveExtraProperties(false)).toBeUndefined();
      expect(resolveExtraProperties(true)).toBeUndefined();
    });
  });

  describe("applyPropertyFilter", () => {
    it("returns properties unchanged when no filter is registered", () => {
      const properties: Props = { theme: "light" };

      expect(applyPropertyFilter(properties)).toBe(properties);
    });

    it("runs properties through the registered filter", () => {
      setPropertyFilter(properties => {
        const filtered = { ...properties };
        delete filtered.sensitive;
        return filtered;
      });

      expect(applyPropertyFilter({ sensitive: "secret", theme: "light" })).toEqual({
        theme: "light",
      });
    });
  });
});
