import { getContactInitial } from "./getContactInitial";

describe("getContactInitial", () => {
  it("returns the first letter and its combining marks in uppercase", () => {
    expect(getContactInitial("olive")).toBe("O");
    expect(getContactInitial("eleonore")).toBe("E");
    expect(getContactInitial("e\u0301lodie")).toBe("E\u0301");
    expect(getContactInitial("Алексей")).toBe("А");
    expect(getContactInitial("مريم")).toBe("م");
  });

  it("returns an empty string for an empty name", () => {
    expect(getContactInitial("")).toBe("");
  });
});
