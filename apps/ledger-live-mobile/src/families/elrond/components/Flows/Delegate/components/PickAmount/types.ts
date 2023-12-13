import type BigNumber from "bignumber.js";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { ElrondDelegationFlowParamList } from "../../types";
import type { ScreenName } from "~/const";

export type PickAmountPropsType = StackNavigatorProps<
  ElrondDelegationFlowParamList,
  ScreenName.ElrondDelegationAmount
>;

export interface RatioType {
  label: string;
  value: BigNumber;
}
