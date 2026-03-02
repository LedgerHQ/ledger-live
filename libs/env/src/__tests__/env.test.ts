import {
  getDefinition,
  getAllEnvNames,
  getAllEnvs,
  getEnv,
  getEnvDefault,
  isEnvDefault,
  getEnvDesc,
  setEnv,
  setEnvUnsafe,
  changes,
} from "../env";

describe("env", () => {
  const envNames = getAllEnvNames();

  describe("getDefinition", () => {
    it("returns definition for existing env name", () => {
      const def = getDefinition("ANALYTICS_CONSOLE");
      expect(def).toBeDefined();
      expect(def?.def).toBe(false);
      expect(def?.desc).toBe("Show tracking overlays on the app UI");
    });

    it("returns undefined for non-existing env name", () => {
      expect(getDefinition("NON_EXISTENT_VAR")).toBeUndefined();
    });
  });

  describe("getAllEnvNames", () => {
    it("returns non-empty array of env names", () => {
      expect(Array.isArray(envNames)).toBe(true);
      expect(envNames.length).toBeGreaterThan(0);
      expect(envNames).toContain("ANALYTICS_CONSOLE");
      expect(envNames).toContain("SEED");
    });
  });

  describe("getAllEnvs", () => {
    it("returns object with all env values", () => {
      const all = getAllEnvs();
      expect(typeof all).toBe("object");
      expect(all.ANALYTICS_CONSOLE).toBeDefined();
      expect(all.SEED).toBe("");
    });
  });

  describe("getEnv and getEnvDefault", () => {
    it("getEnv returns current value, getEnvDefault returns default", () => {
      expect(getEnvDefault("ANALYTICS_CONSOLE")).toBe(false);
      expect(getEnv("ANALYTICS_CONSOLE")).toBe(false);
    });

    it("getEnvDefault returns correct types for various envs", () => {
      expect(getEnvDefault("SEED")).toBe("");
      expect(getEnvDefault("OPERATION_ADDRESSES_LIMIT")).toBe(100);
      expect(getEnvDefault("EIP1559_PRIORITY_FEE_LOWER_GATE")).toBe(0.85);
      expect(getEnvDefault("ADDRESS_POISONING_FAMILIES")).toBe("evm,tron");
    });
  });

  describe("getEnvDesc", () => {
    it("returns description for known env", () => {
      expect(getEnvDesc("ANALYTICS_CONSOLE")).toBe("Show tracking overlays on the app UI");
      expect(getEnvDesc("SEED")).toContain("speculos");
    });
  });

  describe("isEnvDefault", () => {
    it("returns true when value equals default", () => {
      expect(isEnvDefault("ANALYTICS_CONSOLE")).toBe(true);
    });

    it("returns false after setEnv changes value", () => {
      setEnv("ANALYTICS_CONSOLE", true);
      expect(isEnvDefault("ANALYTICS_CONSOLE")).toBe(false);
      setEnv("ANALYTICS_CONSOLE", false);
    });
  });

  describe("setEnv", () => {
    it("updates value and getEnv returns new value", () => {
      setEnv("SEED", "test-seed");
      expect(getEnv("SEED")).toBe("test-seed");
      setEnv("SEED", "");
    });

    it("emits on changes Subject when value actually changes", () => {
      const emitted: Array<{ name: string; value: unknown; oldValue: unknown }> = [];
      const sub = changes.subscribe(e => emitted.push(e));

      setEnv("SEED", "emit-1");
      setEnv("SEED", "emit-2");
      setEnv("SEED", "emit-2"); // no emit, same value

      expect(emitted).toHaveLength(2);
      expect(emitted[0]).toMatchObject({ name: "SEED", value: "emit-1", oldValue: "" });
      expect(emitted[1]).toMatchObject({
        name: "SEED",
        value: "emit-2",
        oldValue: "emit-1",
      });

      sub.unsubscribe();
      setEnv("SEED", "");
    });
  });

  describe("setEnvUnsafe", () => {
    it("returns false for unknown env name", () => {
      expect(setEnvUnsafe("UNKNOWN_ENV_VAR", "value")).toBe(false);
    });

    it("returns false when parser returns undefined (invalid value)", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      // intParser returns undefined only when input is NaN
      expect(setEnvUnsafe("OPERATION_ADDRESSES_LIMIT", NaN)).toBe(false);
      // jsonParser returns undefined for invalid JSON
      expect(setEnvUnsafe("FEATURE_FLAGS", "not-valid-json")).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Invalid ENV value"));
      consoleSpy.mockRestore();
    });

    it("returns true and sets value for valid string", () => {
      expect(setEnvUnsafe("SEED", "my-seed")).toBe(true);
      expect(getEnv("SEED")).toBe("my-seed");
      setEnv("SEED", "");
    });

    it("returns true and sets value for valid int", () => {
      const defaultVal = getEnvDefault("OPERATION_ADDRESSES_LIMIT");
      expect(setEnvUnsafe("OPERATION_ADDRESSES_LIMIT", "42")).toBe(true);
      expect(getEnv("OPERATION_ADDRESSES_LIMIT")).toBe(42);
      setEnv("OPERATION_ADDRESSES_LIMIT", defaultVal);
    });

    it("returns true and sets value for valid boolean", () => {
      expect(setEnvUnsafe("ANALYTICS_CONSOLE", true)).toBe(true);
      expect(getEnv("ANALYTICS_CONSOLE")).toBe(true);
      expect(setEnvUnsafe("ANALYTICS_CONSOLE", "true")).toBe(true);
      expect(getEnv("ANALYTICS_CONSOLE")).toBe(true);
      setEnv("ANALYTICS_CONSOLE", false);
    });

    it("returns true and sets value for valid float", () => {
      const defaultVal = getEnvDefault("EIP1559_PRIORITY_FEE_LOWER_GATE");
      expect(setEnvUnsafe("EIP1559_PRIORITY_FEE_LOWER_GATE", "0.5")).toBe(true);
      expect(getEnv("EIP1559_PRIORITY_FEE_LOWER_GATE")).toBe(0.5);
      setEnv("EIP1559_PRIORITY_FEE_LOWER_GATE", defaultVal);
    });

    it("returns true and sets value for valid JSON (FEATURE_FLAGS)", () => {
      const defaultVal = getEnvDefault("FEATURE_FLAGS");
      const obj = { foo: true };
      expect(setEnvUnsafe("FEATURE_FLAGS", JSON.stringify(obj))).toBe(true);
      expect(getEnv("FEATURE_FLAGS")).toEqual(obj);
      setEnv("FEATURE_FLAGS", defaultVal);
    });

    it("returns true and sets value for valid string array (VERBOSE)", () => {
      const defaultVal = getEnvDefault("VERBOSE");
      expect(setEnvUnsafe("VERBOSE", "apdu,hw,transport")).toBe(true);
      expect(getEnv("VERBOSE")).toEqual(["apdu", "hw", "transport"]);
      setEnv("VERBOSE", defaultVal);
    });

    it("boolParser: treats '0' and 'false' as false", () => {
      setEnvUnsafe("ANALYTICS_CONSOLE", "0");
      expect(getEnv("ANALYTICS_CONSOLE")).toBe(false);
      setEnvUnsafe("ANALYTICS_CONSOLE", "false");
      expect(getEnv("ANALYTICS_CONSOLE")).toBe(false);
      setEnv("ANALYTICS_CONSOLE", false);
    });
  });
});
