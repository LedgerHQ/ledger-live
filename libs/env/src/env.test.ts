import {
  injectDefinitions,
  changes,
  getEnv,
  setEnv,
  setEnvUnsafe,
  getEnvDefault,
  getAllEnvNames,
  getAllEnvs,
  getDefinition,
  getEnvDesc,
  isEnvDefault,
  intParser,
  floatParser,
  boolParser,
  stringParser,
  jsonParser,
  stringArrayParser,
} from "./env";

type LedgerGlobal = typeof globalThis & {
  __ledgerLiveEnvState?: unknown;
  __ledgerLiveEnvListeners?: unknown;
};
const g = globalThis as LedgerGlobal;

const testDefs = {
  MY_INT: { def: 42, parser: intParser, desc: "an integer" },
  MY_FLOAT: { def: 3.14, parser: floatParser, desc: "a float" },
  MY_BOOL: { def: false, parser: boolParser, desc: "a bool" },
  MY_STR: { def: "hello", parser: stringParser, desc: "a string" },
  MY_JSON: { def: {}, parser: jsonParser, desc: "json value" },
  MY_ARR: { def: ["a", "b"], parser: stringArrayParser, desc: "string array" },
} as const;

describe("live-env guard", () => {
  afterEach(() => {
    delete g.__ledgerLiveEnvState;
    delete g.__ledgerLiveEnvListeners;
  });

  it("throws before injectDefinitions", () => {
    expect(() => getEnv("MY_INT")).toThrow(
      "[live-env] Call injectDefinitions() before using live-env",
    );
  });

  it("works after injectDefinitions", () => {
    injectDefinitions(testDefs);
    expect(getEnv("MY_STR")).toBe("hello");
  });

  it("injectDefinitions is idempotent (second call ignored)", () => {
    injectDefinitions(testDefs);
    injectDefinitions({ OTHER: { def: 99, parser: intParser, desc: "" } });
    expect(getEnv("OTHER")).toBeUndefined();
  });
});

describe("live-env API", () => {
  beforeEach(() => {
    delete g.__ledgerLiveEnvState;
    delete g.__ledgerLiveEnvListeners;
    injectDefinitions(testDefs);
  });

  afterEach(() => {
    delete g.__ledgerLiveEnvState;
    delete g.__ledgerLiveEnvListeners;
  });

  it("getEnv returns default", () => {
    expect(getEnv("MY_INT")).toBe(42);
    expect(getEnv("MY_STR")).toBe("hello");
    expect(getEnv("MY_BOOL")).toBe(false);
  });

  it("setEnv updates value and notifies", () => {
    const calls: unknown[] = [];
    const sub = changes.subscribe(e => calls.push(e));
    setEnv("MY_STR", "world");
    expect(getEnv("MY_STR")).toBe("world");
    expect(calls).toHaveLength(1);
    sub.unsubscribe();
  });

  it("setEnv does not notify when value unchanged", () => {
    const calls: unknown[] = [];
    const sub = changes.subscribe(e => calls.push(e));
    setEnv("MY_STR", "hello"); // same as default
    expect(calls).toHaveLength(0);
    sub.unsubscribe();
  });

  it("setEnvUnsafe parses and sets valid value", () => {
    expect(setEnvUnsafe("MY_INT", "7")).toBe(true);
    expect(getEnv("MY_INT")).toBe(7);
  });

  it("setEnvUnsafe returns false for unknown key", () => {
    expect(setEnvUnsafe("UNKNOWN", "x")).toBe(false);
  });

  it("setEnvUnsafe returns false when parser returns undefined", () => {
    // NaN causes intParser to return undefined (Number.isNaN(NaN) === true)
    expect(setEnvUnsafe("MY_INT", NaN)).toBe(false);
  });

  it("getEnvDefault returns original default", () => {
    setEnv("MY_INT", 99);
    expect(getEnvDefault("MY_INT")).toBe(42);
  });

  it("isEnvDefault", () => {
    expect(isEnvDefault("MY_INT")).toBe(true);
    setEnv("MY_INT", 1);
    expect(isEnvDefault("MY_INT")).toBe(false);
  });

  it("getAllEnvNames returns all keys", () => {
    expect(getAllEnvNames()).toEqual(expect.arrayContaining(["MY_INT", "MY_STR"]));
  });

  it("getAllEnvs returns a copy", () => {
    const envs = getAllEnvs();
    expect(envs.MY_INT).toBe(42);
    envs.MY_INT = 999;
    expect(getEnv("MY_INT")).toBe(42);
  });

  it("getDefinition", () => {
    expect(getDefinition("MY_INT")).toMatchObject({ def: 42, desc: "an integer" });
    expect(getDefinition("NOPE")).toBeUndefined();
  });

  it("getEnvDesc", () => {
    expect(getEnvDesc("MY_STR")).toBe("a string");
    expect(getEnvDesc("NOPE")).toBe("");
  });
});

describe("parsers", () => {
  it("intParser", () => {
    expect(intParser("5")).toBe(5);
    expect(intParser(3)).toBe(3);
    expect(intParser(NaN)).toBeUndefined();
  });

  it("floatParser", () => {
    expect(floatParser("1.5")).toBeCloseTo(1.5);
    expect(floatParser(NaN)).toBeUndefined();
  });

  it("boolParser", () => {
    expect(boolParser(true)).toBe(true);
    expect(boolParser(false)).toBe(false);
    expect(boolParser("0")).toBe(false);
    expect(boolParser("false")).toBe(false);
    expect(boolParser("1")).toBe(true);
  });

  it("stringParser", () => {
    expect(stringParser("hello")).toBe("hello");
    expect(stringParser(42)).toBeUndefined();
  });

  it("jsonParser", () => {
    expect(jsonParser('{"a":1}')).toEqual({ a: 1 });
    expect(jsonParser("not json")).toBeUndefined();
    expect(jsonParser(42)).toBeUndefined();
  });

  it("stringArrayParser", () => {
    expect(stringArrayParser("a,b,c")).toEqual(["a", "b", "c"]);
    expect(stringArrayParser(42)).toBeUndefined();
    expect(stringArrayParser("")).toEqual([""]);
  });
});
