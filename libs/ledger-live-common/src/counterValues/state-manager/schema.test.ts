import {
  counterValueIdsSortedByMarketCapSchema as schema,
  idsMock,
  defaultCounterValueIdsSortedByMarketCap,
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
