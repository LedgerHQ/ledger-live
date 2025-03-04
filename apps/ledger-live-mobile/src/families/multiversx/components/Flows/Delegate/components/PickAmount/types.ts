import type BigNumber from "bignumber.js";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { MultiversXDelegationFlowParamList } from "../../types";
import type { ScreenName } from "~/const";

export type PickAmountPropsType = StackNavigatorProps<
  MultiversXDelegationFlowParamList,
  ScreenName.MultiversXDelegationAmount
>;

export interface RatioType {
  label: string;
  value: BigNumber;
}
