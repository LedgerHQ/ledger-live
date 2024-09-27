import type BigNumber from "bignumber.js";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { MultiversxDelegationFlowParamList } from "../../types";
import type { ScreenName } from "~/const";

export type PickAmountPropsType = StackNavigatorProps<
  MultiversxDelegationFlowParamList,
  ScreenName.MultiversxDelegationAmount
>;

export interface RatioType {
  label: string;
  value: BigNumber;
}
