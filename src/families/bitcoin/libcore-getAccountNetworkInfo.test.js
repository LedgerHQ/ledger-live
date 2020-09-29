// @flow

import { avoidDups } from "./libcore-getAccountNetworkInfo";
import { BigNumber } from "bignumber.js";

test("avoidFeeDupsInFeePerByte [3,2,2] => [4,3,2]", async () => {
  expect(avoidDups([BigNumber(3), BigNumber(3), BigNumber(2)])).toEqual([
    BigNumber(4),
    BigNumber(3),
    BigNumber(2),
  ]);
});
test("avoidFeeDupsInFeePerByte [2,2,1] => [3,2,1]", async () => {
  expect(avoidDups([BigNumber(2), BigNumber(2), BigNumber(1)])).toEqual([
    BigNumber(3),
    BigNumber(2),
    BigNumber(1),
  ]);
});
test("avoidFeeDupsInFeePerByte [3,3,3] => [5,4,3]", async () => {
  expect(avoidDups([BigNumber(3), BigNumber(3), BigNumber(3)])).toEqual([
    BigNumber(5),
    BigNumber(4),
    BigNumber(3),
  ]);
});
test("avoidFeeDupsInFeePerByte [3,2,1] => [3,2,1]", async () => {
  expect(avoidDups([BigNumber(3), BigNumber(2), BigNumber(1)])).toEqual([
    BigNumber(3),
    BigNumber(2),
    BigNumber(1),
  ]);
});
test("avoidFeeDupsInFeePerByte [100,100,1] => [101,100,1]", async () => {
  expect(avoidDups([BigNumber(100), BigNumber(100), BigNumber(1)])).toEqual([
    BigNumber(101),
    BigNumber(100),
    BigNumber(1),
  ]);
});
