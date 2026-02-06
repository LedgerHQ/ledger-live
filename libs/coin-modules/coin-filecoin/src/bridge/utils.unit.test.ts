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
  expect(isValidHex("0x0001aaeeff")).toBe(true);
  expect(isValidHex("0001aaeeff")).toBe(true);
  expect(isValidHex("0x0001rreeta")).toBe(false);
  expect(isValidHex("0x0001aaeef")).toBe(false);
});

test("isValidBase64", () => {
  expect(isValidBase64("YXNkYWZhc2Rmc2Rm")).toBe(true);
  expect(
    isValidBase64(
      "YXNmZHNhZGZzYWRmYXNkZnNhZGZzYWRmYXNkZnNhZGYyNTEyMzQxMjIzcjZmYXM0MmZhczJkMTNhc2M=",
    ),
  ).toBe(true);
  expect(isValidBase64("asdasd````")).toBe(false);
});
