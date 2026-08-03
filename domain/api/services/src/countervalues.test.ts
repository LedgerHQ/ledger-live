import { countervaluesApi, cvsApiExtra, getCvsExtra } from "./countervalues";

const valid = { countervaluesServiceUrl: "https://cvs.test" };

describe("countervaluesApi", () => {
  it("has the correct reducer path", () => {
    expect(countervaluesApi.reducerPath).toBe("countervaluesApi");
  });

  it("declares no endpoints of its own", () => {
    expect(Object.keys(countervaluesApi.endpoints)).toHaveLength(0);
  });
});

describe("cvsApiExtra", () => {
  it("returns the validated config", () => {
    expect(cvsApiExtra(valid)).toEqual(valid);
  });

  it("throws when the url is missing or empty", () => {
    // @ts-expect-error — countervaluesServiceUrl is required
    expect(() => cvsApiExtra({})).toThrow();
    expect(() => cvsApiExtra({ countervaluesServiceUrl: "" })).toThrow();
  });
});

describe("getCvsExtra", () => {
  it("reads the config off the thunk extraArgument", () => {
    expect(getCvsExtra({ extra: valid })).toBe(valid);
  });
});
