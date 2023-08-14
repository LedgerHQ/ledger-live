import { BigNumber } from "bignumber.js";
import { upperModulo } from "../modulo";
test("upperModulo lower value", () => {
  expect(upperModulo(new BigNumber("21111"), new BigNumber("136"), new BigNumber("1000"))).toEqual(
    new BigNumber("21136"),
  );
});
test("upperModulo equal value", () => {
  expect(upperModulo(new BigNumber("21136"), new BigNumber("136"), new BigNumber("1000"))).toEqual(
    new BigNumber("21136"),
  );
});
test("upperModulo upper value", () => {
  expect(upperModulo(new BigNumber("21611"), new BigNumber("136"), new BigNumber("1000"))).toEqual(
    new BigNumber("22136"),
  );
});
