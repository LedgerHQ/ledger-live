import {
  applyPropsFilter,
  getAnalytics,
  isEnabled,
  resolveExtraProps,
  setAnalytics,
  setEnabledFn,
  setExtraPropsFn,
  setMandatoryExtraPropsFn,
  setPropsFilter,
} from "./registry";

beforeEach(() => {
  setAnalytics(undefined);
  setEnabledFn(undefined);
  setExtraPropsFn(undefined);
  setMandatoryExtraPropsFn(undefined);
  setPropsFilter(undefined);
});

describe("registry", () => {
  describe("getAnalytics", () => {
    it("returns the injected analytics", () => {
      const myAnalytics = { track: jest.fn() };
      setAnalytics(myAnalytics);

      expect(getAnalytics()).toBe(myAnalytics);
    });

    it("returns undefined after the analytics client is cleared", () => {
      setAnalytics({ track: jest.fn() });
      setAnalytics(undefined);

      expect(getAnalytics()).toBeUndefined();
    });
  });

  describe("isEnabled", () => {
    it("is false by default", () => {
      expect(isEnabled()).toEqual(false);
    });

    it("is true when the enabled function returns true", () => {
      setEnabledFn(() => true);

      expect(isEnabled()).toEqual(true);
    });

    it("is false when the enabled function returns false", () => {
      setEnabledFn(() => false);

      expect(isEnabled()).toEqual(false);
    });

    it("is false after the enabled function is cleared", () => {
      setEnabledFn(() => true);
      setEnabledFn(undefined);

      expect(isEnabled()).toEqual(false);
    });
  });

  describe("resolveExtraProps", () => {
    it("uses the extra props function for non-mandatory events", () => {
      setExtraPropsFn(() => ({ extra: "props" }));
      setMandatoryExtraPropsFn(() => ({ mandatory: "props" }));

      expect(resolveExtraProps(false)).toEqual({ extra: "props" });
    });

    it("uses the mandatory extra props function for mandatory events", () => {
      setExtraPropsFn(() => ({ extra: "props" }));
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
      expect(applyPropsFilter({ harmless: "unfiltered" })).toStrictEqual({
        harmless: "unfiltered",
      });
    });

    it("runs props through the registered filter", () => {
      setPropsFilter(props => {
        const filtered = { ...props };
        delete filtered.sensitive;
        return filtered;
      });

      expect(applyPropsFilter({ sensitive: "filtered", harmless: "unfiltered" })).toEqual({
        harmless: "unfiltered",
      });
    });
  });
});
