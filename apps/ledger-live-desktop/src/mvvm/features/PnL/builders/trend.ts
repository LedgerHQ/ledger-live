import type { BigNumber } from "bignumber.js";
import { TriangleUp, TriangleDown } from "@ledgerhq/lumen-ui-react/symbols";
import type { TrendIconConfig } from "../components/PnLCard/types";

const UP: TrendIconConfig = { Icon: TriangleUp, className: "text-success" };
const DOWN: TrendIconConfig = { Icon: TriangleDown, className: "text-error" };
const NEUTRAL: TrendIconConfig = { Icon: TriangleUp, className: "text-disabled" };

export function getTrendIcon(value: BigNumber): TrendIconConfig {
  if (value.isZero()) return NEUTRAL;
  if (value.isNegative()) return DOWN;
  return UP;
}
