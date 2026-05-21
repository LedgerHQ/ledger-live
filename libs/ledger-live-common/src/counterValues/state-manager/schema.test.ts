import {
  counterValueIdsSortedByMarketCapSchema as schema,
  idsMock,
  defaultCounterValueIdsSortedByMarketCap,
  spotSimpleResponseSchema,
  spotSimpleResponseMock,
} from "./schema";

it("validates correct data", () => {
  expect(() => schema.parse(idsMock)).not.toThrow();
});

it("rejects invalid data", () => {
  expect(() => schema.parse("string-not-an-array")).toThrow();
  expect(() => schema.parse(123)).toThrow();
  expect(() => schema.parse({ bad: "data" })).toThrow();
});

it("exports the default value for this schema", () => {
  expect(defaultCounterValueIdsSortedByMarketCap).toEqual([]);
});

describe("spotSimpleResponseSchema", () => {
  it("validates a well-formed spot rate map", () => {
    expect(() => spotSimpleResponseSchema.parse(spotSimpleResponseMock)).not.toThrow();
    expect(() => spotSimpleResponseSchema.parse({ USD: 0.863051 })).not.toThrow();
  });

  it("validates an empty object", () => {
    expect(() => spotSimpleResponseSchema.parse({})).not.toThrow();
  });

  it("rejects non-numeric values", () => {
    expect(() => spotSimpleResponseSchema.parse({ USD: "0.9" })).toThrow();
  });

  it("rejects non-object top-level values", () => {
    expect(() => spotSimpleResponseSchema.parse("not-an-object")).toThrow();
  });
});
