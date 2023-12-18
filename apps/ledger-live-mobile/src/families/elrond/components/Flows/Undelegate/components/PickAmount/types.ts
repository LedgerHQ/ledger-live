import type BigNumber from "bignumber.js";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { ElrondUndelegationFlowParamList } from "../../types";
import type { ScreenName } from "~/const";

export type PickAmountPropsType = StackNavigatorProps<
  ElrondUndelegationFlowParamList,
  ScreenName.ElrondUndelegationAmount
>;

export interface RatioType {
  label: string;
  value: BigNumber;
}
