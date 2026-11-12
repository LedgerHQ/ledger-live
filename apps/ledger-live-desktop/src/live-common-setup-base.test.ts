import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { parseCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { setupBase } from "./live-common-setup-base";

describe("setupBase", () => {
  beforeAll(() => {
    setupBase({ platformOS: "test", platformVersion: "0" });
  });

  it("keeps bignumber.js STRICT mode on", () => {
    expect(BigNumber.config({}).STRICT).toBe(true);
    expect(() => new BigNumber("abc")).toThrow();
  });

  it.each(["", " ", "abc"])("keeps parseCurrencyUnit(%p) at 0 instead of throwing", value => {
    expect(parseCurrencyUnit(getCryptoCurrencyById("bitcoin").units[0], value).toNumber()).toBe(0);
  });
});
