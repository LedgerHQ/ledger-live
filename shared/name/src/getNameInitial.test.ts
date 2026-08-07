import { getNameInitial } from "./getNameInitial";

describe("getNameInitial", () => {
  it("returns the first letter and its combining marks in uppercase", () => {
    expect(getNameInitial("olive")).toBe("O");
    expect(getNameInitial("eleonore")).toBe("E");
    expect(getNameInitial("élodie")).toBe("É");
    expect(getNameInitial("Алексей")).toBe("А");
    expect(getNameInitial("مريم")).toBe("م");
  });

  it("returns an empty string for an empty name", () => {
    expect(getNameInitial("")).toBe("");
  });
});
