import { isValidBase64, isValidHex, methodToString } from "./utils";

test("methodToString", () => {
  const str1 = methodToString(0);
  expect(str1).toBe("Transfer");
  const str2 = methodToString(3844450837);
  expect(str2).toBe("InvokeEVM (3844450837)");
  const str3 = methodToString(5649856);
  expect(str3).toBe("Unknown");
});

test("isValidHex", () => {
  expect(isValidHex("0x0001aaeeff")).toBeTruthy();
  expect(isValidHex("0001aaeeff")).toBeTruthy();
  expect(isValidHex("0x0001rreeta")).toBeFalsy();
  expect(isValidHex("0x0001aaeef")).toBeFalsy();
});

test("isValidBase64", () => {
  expect(isValidBase64("YXNkYWZhc2Rmc2Rm")).toBeTruthy();
  expect(
    isValidBase64(
      "YXNmZHNhZGZzYWRmYXNkZnNhZGZzYWRmYXNkZnNhZGYyNTEyMzQxMjIzcjZmYXM0MmZhczJkMTNhc2M=",
    ),
  ).toBeTruthy();
  expect(isValidBase64("asdasd````")).toBeFalsy();
});
