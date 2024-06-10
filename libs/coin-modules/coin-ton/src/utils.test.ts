import { TonComment } from "./types";
import { addressesAreEqual, commentIsValid, isAddressValid } from "./utils";

describe("TON addresses", () => {
  const addr = {
    raw: "0:074c7194d64e8218f2cfaab8e79b34201adbed0f8fa7f2773e604dd39969b5ff",
    rawWrong: "0:074c7194d64e8218f2cfaab8e79b34201adbed0f8fa7f2773e604dd39969b5f",
    bounceUrl: "EQAHTHGU1k6CGPLPqrjnmzQgGtvtD4-n8nc-YE3TmWm1_1JZ",
    bounceNoUrl: "EQAHTHGU1k6CGPLPqrjnmzQgGtvtD4+n8nc+YE3TmWm1/1JZ",
    bounceWrong: "EQAHTHGU1k6CGPLPqrjnmzQgGtvtD4+n8nc+YE3TmWm1/1J",
    noBounceUrl: "UQAHTHGU1k6CGPLPqrjnmzQgGtvtD4-n8nc-YE3TmWm1_w-c",
    noBounceNoUrl: "UQAHTHGU1k6CGPLPqrjnmzQgGtvtD4+n8nc+YE3TmWm1/w+c",
    noBounceWrong: "UQAHTHGU1k6CGPLPqrjnmzQgGtvtD4+n8nc+YE3TmWm1/w+",
    diff: "UQBjrXgZbYDCpxLKpgMnBe985kYDfUeriuYUafbuKgdBpWuJ",
  };
  test("Check if addresses are valid", () => {
    expect(isAddressValid(addr.raw)).toBe(true);
    expect(isAddressValid(addr.bounceUrl)).toBe(true);
    expect(isAddressValid(addr.bounceNoUrl)).toBe(true);
    expect(isAddressValid(addr.noBounceUrl)).toBe(true);
    expect(isAddressValid(addr.noBounceNoUrl)).toBe(true);
    expect(isAddressValid(addr.rawWrong)).toBe(false);
    expect(isAddressValid(addr.bounceWrong)).toBe(false);
    expect(isAddressValid(addr.noBounceWrong)).toBe(false);
    expect(isAddressValid(addr.diff)).toBe(true);
  });
  test("Compare addresses", () => {
    expect(addressesAreEqual(addr.raw, addr.bounceUrl)).toBe(true);
    expect(addressesAreEqual(addr.raw, addr.noBounceUrl)).toBe(true);
    expect(addressesAreEqual(addr.bounceUrl, addr.noBounceUrl)).toBe(true);
    expect(addressesAreEqual(addr.rawWrong, addr.noBounceUrl)).toBe(false);
    expect(addressesAreEqual(addr.noBounceNoUrl, addr.diff)).toBe(false);
  });
});

test("TON Comments are valid", () => {
  const msg = (e: boolean, m: string): TonComment => ({ isEncrypted: e, text: m });
  expect(commentIsValid(msg(false, ""))).toBe(true);
  expect(commentIsValid(msg(false, "Hello world!"))).toBe(true);
  expect(
    commentIsValid(
      msg(
        false,
        " 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789", // 120 chars
      ),
    ),
  ).toBe(true);
  expect(
    commentIsValid(
      msg(
        false,
        " 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 ", // 121 chars
      ),
    ),
  ).toBe(false);
  expect(commentIsValid(msg(false, "😀"))).toBe(false);
  expect(commentIsValid(msg(true, ""))).toBe(false);
});
