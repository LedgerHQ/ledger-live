import type BigNumber from "bignumber.js";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { MultiversXUndelegationFlowParamList } from "../../types";
import type { ScreenName } from "~/const";

export type PickAmountPropsType = StackNavigatorProps<
  MultiversXUndelegationFlowParamList,
  ScreenName.MultiversXUndelegationAmount
>;

export interface RatioType {
  label: string;
  value: BigNumber;
}
