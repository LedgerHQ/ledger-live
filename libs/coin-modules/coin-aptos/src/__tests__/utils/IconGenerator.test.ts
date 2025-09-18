import { IconGenerator } from "../../utils";

describe("IconGenerator", () => {
  it("returns a picture bitmap", () => {
    const icon = new IconGenerator("seed");
    expect(icon).toBeInstanceOf(IconGenerator);
    expect(icon.generate).toBeInstanceOf(Function);

    const iconString = icon.generate();
    expect(typeof iconString).toBe("string");
    expect(iconString.startsWith("data:image/bmp;base64")).toBe(true);
  });
});
