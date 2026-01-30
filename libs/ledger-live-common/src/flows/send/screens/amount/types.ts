import type { BigNumber } from "bignumber.js";
import type { AmountScreenMessage } from "./utils/messages";
import type { FeePresetOption } from "./utils/feeEstimation";

export type AmountScreenQuickAction = Readonly<{
  id: string;
  label: string;
  onPress: () => void;
  active: boolean;
  disabled: boolean;
}>;

export type { AmountScreenMessage, FeePresetOption };

export type FeeFiatMap = Readonly<Record<string, string | null>>;
export type FeePresetLegendMap = Readonly<Record<string, string>>;
