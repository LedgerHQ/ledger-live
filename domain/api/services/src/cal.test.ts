import { calApi, calApiExtra, getCalExtra } from "./cal";

const valid = { calServiceUrl: "https://cal.test", ledgerClientVersion: "test" };

describe("calApi", () => {
  it("has the correct reducer path", () => {
    expect(calApi.reducerPath).toBe("calApi");
  });

  it("declares no endpoints of its own", () => {
    expect(Object.keys(calApi.endpoints)).toHaveLength(0);
  });
});

describe("calApiExtra", () => {
  it("returns the validated config", () => {
    expect(calApiExtra(valid)).toEqual(valid);
  });

  it("keeps the optional logger", () => {
    const logger = jest.fn();
    expect(calApiExtra({ ...valid, logger })).toEqual({ ...valid, logger });
  });

  it("throws when the service url is missing or empty", () => {
    // @ts-expect-error — calServiceUrl is required
    expect(() => calApiExtra({ ledgerClientVersion: "test" })).toThrow();
    expect(() => calApiExtra({ ...valid, calServiceUrl: "" })).toThrow();
  });

  it("throws when the client version is missing or empty", () => {
    // @ts-expect-error — ledgerClientVersion is required
    expect(() => calApiExtra({ calServiceUrl: "https://cal.test" })).toThrow();
    expect(() => calApiExtra({ ...valid, ledgerClientVersion: "" })).toThrow();
  });
});

describe("getCalExtra", () => {
  it("reads the config off the thunk extraArgument", () => {
    expect(getCalExtra({ extra: valid })).toBe(valid);
  });
});
