// @flow
import { BigNumber } from "bignumber.js";
import { upperModulo } from "../modulo";

test("upperModulo lower value", () => {
  expect(
    upperModulo(BigNumber("21111"), BigNumber("136"), BigNumber("1000"))
  ).toEqual(BigNumber("21136"));
});

test("upperModulo equal value", () => {
  expect(
    upperModulo(BigNumber("21136"), BigNumber("136"), BigNumber("1000"))
  ).toEqual(BigNumber("21136"));
});

test("upperModulo upper value", () => {
  expect(
    upperModulo(BigNumber("21611"), BigNumber("136"), BigNumber("1000"))
  ).toEqual(BigNumber("22136"));
});
