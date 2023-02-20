import { BigNumber } from "bignumber.js";
import { toLocaleString } from "./BigNumberToLocaleString";
test("basic toLocaleString usage", () => {
  expect(toLocaleString(new BigNumber(0))).toBe("0");
  expect(toLocaleString(new BigNumber(8))).toBe("8");
  expect(toLocaleString(new BigNumber(123))).toBe("123");
  expect(toLocaleString(new BigNumber(0.001))).toBe("0.001");
  expect(toLocaleString(new BigNumber(13.1))).toBe("13.1");
  expect(toLocaleString(new BigNumber(123.01))).toBe("123.01");
  expect(toLocaleString(new BigNumber(123.012))).toBe("123.012");
  expect(toLocaleString(new BigNumber(1123))).toBe("1,123");
  expect(toLocaleString(new BigNumber("9999999999999999"))).toBe(
    "9,999,999,999,999,999"
  );
  expect(toLocaleString(new BigNumber("9999999999999.99"))).toBe(
    "9,999,999,999,999.99"
  );
});
test("toLocaleString to default maximumFractionDigits to 3", () => {
  expect(toLocaleString(new BigNumber(4.44444))).toBe("4.444");
  expect(toLocaleString(new BigNumber(444444.444444444))).toBe("444,444.444");
  expect(toLocaleString(new BigNumber(0.444444444))).toBe("0.444");
  expect(toLocaleString(new BigNumber(9.99999))).toBe("9.999");
  expect(toLocaleString(new BigNumber(111111.111111111))).toBe("111,111.111");
  expect(toLocaleString(new BigNumber(0.999999999))).toBe("0.999");
  expect(toLocaleString(new BigNumber(9.5))).toBe("9.5");
  expect(toLocaleString(new BigNumber(9.9))).toBe("9.9");
  expect(toLocaleString(new BigNumber(99.6))).toBe("99.6");
  expect(toLocaleString(new BigNumber(99.8))).toBe("99.8");
  expect(toLocaleString(new BigNumber(999.7))).toBe("999.7");
  expect(toLocaleString(new BigNumber(999.9))).toBe("999.9");
  expect(toLocaleString(new BigNumber(999999.7))).toBe("999,999.7");
  expect(toLocaleString(new BigNumber(999999.9))).toBe("999,999.9");
});
test("toLocaleString minimumFractionDigits", () => {
  expect(
    toLocaleString(new BigNumber(0), "en", {
      minimumFractionDigits: 1,
    })
  ).toBe("0.0");
  expect(
    toLocaleString(new BigNumber(8), "en", {
      minimumFractionDigits: 1,
    })
  ).toBe("8.0");
  expect(
    toLocaleString(new BigNumber(123), "en", {
      minimumFractionDigits: 1,
    })
  ).toBe("123.0");
  expect(
    toLocaleString(new BigNumber(0.001), "en", {
      minimumFractionDigits: 1,
    })
  ).toBe("0.001");
  expect(
    toLocaleString(new BigNumber(9.5), "en", {
      minimumFractionDigits: 1,
    })
  ).toBe("9.5");
  expect(
    toLocaleString(new BigNumber(9.6), "en", {
      minimumFractionDigits: 2,
    })
  ).toBe("9.60");
  expect(
    toLocaleString(new BigNumber(13.1), "en", {
      minimumFractionDigits: 3,
    })
  ).toBe("13.100");
  expect(
    toLocaleString(new BigNumber(123.01), "en", {
      minimumFractionDigits: 5,
    })
  ).toBe("123.01000");
  expect(
    toLocaleString(new BigNumber(123.012), "en", {
      minimumFractionDigits: 10,
    })
  ).toBe("123.0120000000");
  expect(
    toLocaleString(new BigNumber(1123), "en", {
      minimumFractionDigits: 1,
    })
  ).toBe("1,123.0");
  expect(
    toLocaleString(new BigNumber("9999999999999999"), "en", {
      minimumFractionDigits: 1,
    })
  ).toBe("9,999,999,999,999,999.0");
  expect(
    toLocaleString(new BigNumber("9999999999999.999"), "en", {
      minimumFractionDigits: 5,
    })
  ).toBe("9,999,999,999,999.99900");
});
test("toLocaleString minimumFractionDigits and maximumFractionDigits", () => {
  expect(
    toLocaleString(new BigNumber(1), "en", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 5,
    })
  ).toBe("1.0");
  expect(
    toLocaleString(new BigNumber(1.003), "en", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 5,
    })
  ).toBe("1.003");
  expect(
    toLocaleString(new BigNumber(1.000003), "en", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 5,
    })
  ).toBe("1.0");
  expect(
    toLocaleString(new BigNumber(1.333333333333), "en", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 5,
    })
  ).toBe("1.33333");
  expect(
    toLocaleString(new BigNumber(0), "en", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 5,
    })
  ).toBe("0.0");
  expect(
    toLocaleString(new BigNumber(0.003), "en", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 5,
    })
  ).toBe("0.003");
  expect(
    toLocaleString(new BigNumber(0.000003), "en", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 5,
    })
  ).toBe("0.0");
  expect(
    toLocaleString(new BigNumber(9.7), "en", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })
  ).toBe("9.7");
  expect(
    toLocaleString(
      new BigNumber("4.4444444444444444444411111111111111"),
      "en",
      {
        maximumFractionDigits: 20,
      }
    )
  ).toBe("4.44444444444444444444");
});
