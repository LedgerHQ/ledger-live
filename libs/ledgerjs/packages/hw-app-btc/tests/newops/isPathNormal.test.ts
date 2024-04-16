import { isPathNormal } from "../../src/BtcNew";

describe("isPathNormal", () => {
  describe("should return true for normal and supported paths", () => {
    test.each([
      "44'/0'/0'",
      "44'/0'/0'/0/0",
      "84'/0'/0'",
      "84'/0'/0'/0/0",
      "86'/0'/0'",
      "86'/0'/0'/0/0",
      "49'/0'/0'",
      "49'/0'/0'/0/0",
      "48'/1'/99'/7'",
      "86'/1'/99'/0",
      "48'/0'/99'/7'/1/17",
    ])("%s", path => {
      expect(isPathNormal(path)).toEqual(true);
    });
  });

  describe("should return false for non-normal or non supported paths", () => {
    test.each(["48'/0'/99'", "48'/0'/99'/7'/1/17/2", "199'/0'/1'/0/88", "86'/1'/99'/2"])(
      "%s",
      path => {
        expect(isPathNormal(path)).toEqual(false);
      },
    );
  });
});
