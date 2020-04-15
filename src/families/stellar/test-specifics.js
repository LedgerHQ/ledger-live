// @flow

import getMemoType from "./memo-type-check.js";
import {
  memoTypeSelectStellarMockAddress,
  notCreatedStellarMockAddress
} from "./test-dataset";

export default () => {
  describe("memo type check", () => {
    test("should return a memo type MEMO_TEXT", async () => {
      const memoType = await getMemoType(memoTypeSelectStellarMockAddress);
      expect(memoType).toEqual("MEMO_TEXT");
    });

    test("should return a memo type NULL", async () => {
      const memoType = await getMemoType(notCreatedStellarMockAddress);
      expect(memoType).toEqual(null);
    });
  });
};
