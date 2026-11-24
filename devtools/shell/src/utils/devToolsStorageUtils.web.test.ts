import { deserialize } from "../utils/devToolsStorageUtils";

describe("deserialize", () => {
  it("returns empty object for an empty JSON object", () => {
    expect(deserialize("{}")).toEqual({});
  });

  it("returns empty object for a non-object payload", () => {
    expect(deserialize("null")).toEqual({});
    expect(deserialize('"string"')).toEqual({});
    expect(deserialize("42")).toEqual({});
  });

  it("extracts a string activeToolId", () => {
    expect(deserialize('{"activeToolId":"feature-flags"}')).toEqual({
      activeToolId: "feature-flags",
    });
  });

  it("extracts a null activeToolId", () => {
    expect(deserialize('{"activeToolId":null}')).toEqual({ activeToolId: null });
  });

  it("ignores a non-string, non-null activeToolId", () => {
    expect(deserialize('{"activeToolId":42}')).toEqual({});
  });

  it("extracts a valid recentToolIds array", () => {
    expect(deserialize('{"recentToolIds":["a","b"]}')).toEqual({
      recentToolIds: ["a", "b"],
    });
  });

  it("filters non-string entries from recentToolIds", () => {
    expect(deserialize('{"recentToolIds":["a",1,null,"b"]}')).toEqual({
      recentToolIds: ["a", "b"],
    });
  });

  it("ignores recentToolIds when it is not an array", () => {
    expect(deserialize('{"recentToolIds":"not-an-array"}')).toEqual({});
  });

  it("extracts both fields when both are valid", () => {
    expect(
      deserialize('{"activeToolId":"feature-flags","recentToolIds":["feature-flags"]}'),
    ).toEqual({ activeToolId: "feature-flags", recentToolIds: ["feature-flags"] });
  });
});
