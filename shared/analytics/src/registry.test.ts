import {
  applyPropsFilter,
  getAnalytics,
  getEnabledFn,
  resolveExtraProps,
  setAnalytics,
  setEnabledFn,
  setExtraPropsFn,
  setMandatoryExtraPropsFn,
  setPropsFilter,
} from "./registry";
import type { Analytics, Props } from "./types";

const transport = { track: jest.fn() } as Analytics;

beforeEach(() => {
  setAnalytics({ track: jest.fn() });
  setEnabledFn(undefined);
  setExtraPropsFn(undefined);
  setMandatoryExtraPropsFn(undefined);
  setPropsFilter(undefined);
});

describe("@shared/analytics registry", () => {
  describe("consumers of @shared/analytics set their own interface", () => {
    it("round-trips analytics transport", () => {
      setAnalytics(transport);

      expect(getAnalytics()).toBe(transport);
    });

    it("round-trips enabled function", () => {
      const enabled = () => true;
      setEnabledFn(enabled);

      expect(getEnabledFn()).toBe(enabled);
    });

    it("clears enabled function when set to undefined", () => {
      setEnabledFn(() => true);
      setEnabledFn(undefined);

      expect(getEnabledFn()).toBeUndefined();
    });
  });

  describe("resolveExtraProps", () => {
    it("uses the extra props function for non-mandatory events", () => {
      setExtraPropsFn(() => ({ extra: "props" }));

      expect(resolveExtraProps(false)).toEqual({ extra: "props" });
    });

    it("uses the mandatory extra props function for mandatory events", () => {
      setMandatoryExtraPropsFn(() => ({ mandatory: "props" }));

      expect(resolveExtraProps(true)).toEqual({ mandatory: "props" });
    });

    it("returns undefined when no function is registered", () => {
      expect(resolveExtraProps(false)).toBeUndefined();
      expect(resolveExtraProps(true)).toBeUndefined();
    });
  });

  describe("applyPropsFilter", () => {
    it("returns props unchanged when no filter is registered", () => {
      const props: Props = { theme: "light" };

      expect(applyPropsFilter(props)).toBe(props);
    });

    it("runs props through the registered filter", () => {
      setPropsFilter(props => {
        const filtered = { ...props };
        delete filtered.sensitive;
        return filtered;
      });

      expect(applyPropsFilter({ sensitive: "secret", theme: "light" })).toEqual({
        theme: "light",
      });
    });
  });
});
