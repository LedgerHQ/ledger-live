import { deserializeError, serializeError } from "./helpers";

describe("resiliency of deserializeError", () => {
  [
    0,
    1,
    "",
    "foo",
    null,
    undefined,
    false,
    true,
    Symbol("bro"),
    {},
    { name: "foo" },
    { name: "foo", stack: "" },
  ].forEach(value => {
    it("should never crashes whatever the value is " + JSON.stringify(value), () => {
      expect(() => deserializeError(value)).not.toThrow();
    });
  });
});

describe("resiliency of serializeError", () => {
  [
    0,
    1,
    "",
    "foo",
    null,
    undefined,
    false,
    true,
    Symbol("bro"),
    {},
    { name: "foo" },
    { name: "foo", stack: "" },
  ].forEach(value => {
    it("should never crashes whatever the value is " + JSON.stringify(value), () => {
      expect(() => serializeError(value as any)).not.toThrow();
    });
  });
});
