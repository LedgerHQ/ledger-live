import { BigNumber } from "bignumber.js";
import { avoidDups } from "./getAccountNetworkInfo";
test("avoidFeeDupsInFeePerByte [3,2,2] => [4,3,2]", async () => {
  expect(avoidDups([new BigNumber(3), new BigNumber(3), new BigNumber(2)])).toEqual([
    new BigNumber(4),
    new BigNumber(3),
    new BigNumber(2),
  ]);
});
test("avoidFeeDupsInFeePerByte [2,2,1] => [3,2,1]", async () => {
  expect(avoidDups([new BigNumber(2), new BigNumber(2), new BigNumber(1)])).toEqual([
    new BigNumber(3),
    new BigNumber(2),
    new BigNumber(1),
  ]);
});
test("avoidFeeDupsInFeePerByte [3,3,3] => [5,4,3]", async () => {
  expect(avoidDups([new BigNumber(3), new BigNumber(3), new BigNumber(3)])).toEqual([
    new BigNumber(5),
    new BigNumber(4),
    new BigNumber(3),
  ]);
});
test("avoidFeeDupsInFeePerByte [3,2,1] => [3,2,1]", async () => {
  expect(avoidDups([new BigNumber(3), new BigNumber(2), new BigNumber(1)])).toEqual([
    new BigNumber(3),
    new BigNumber(2),
    new BigNumber(1),
  ]);
});
test("avoidFeeDupsInFeePerByte [100,100,1] => [101,100,1]", async () => {
  expect(avoidDups([new BigNumber(100), new BigNumber(100), new BigNumber(1)])).toEqual([
    new BigNumber(101),
    new BigNumber(100),
    new BigNumber(1),
  ]);
});
