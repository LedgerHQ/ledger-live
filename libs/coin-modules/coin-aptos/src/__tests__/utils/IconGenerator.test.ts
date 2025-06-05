import { IconGenerator } from "../../utils";

describe("IconGenerator", () => {
  it("returns a picture bitmap", () => {
    const icon = new IconGenerator("bazinga");

    expect(typeof icon).toBe("object");
    expect(icon).toHaveProperty("generate");

    const iconString = icon.generate();
    expect(typeof iconString).toBe("string");
  });
});
