import { BigNumber } from "bignumber.js";
import { TriangleUp, TriangleDown } from "@ledgerhq/lumen-ui-react/symbols";
import { getTrendIcon } from "../trend";

describe("getTrendIcon", () => {
  it.each([
    [new BigNumber(10), { Icon: TriangleUp, className: "text-success" }],
    [new BigNumber(-10), { Icon: TriangleDown, className: "text-error" }],
    [new BigNumber(0), { Icon: TriangleUp, className: "text-disabled" }],
  ] as const)("maps %s to the expected icon", (value, expected) => {
    expect(getTrendIcon(value)).toEqual(expected);
  });
});
