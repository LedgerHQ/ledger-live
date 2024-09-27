import type BigNumber from "bignumber.js";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { MultiversxUndelegationFlowParamList } from "../../types";
import type { ScreenName } from "~/const";

export type PickAmountPropsType = StackNavigatorProps<
  MultiversxUndelegationFlowParamList,
  ScreenName.MultiversxUndelegationAmount
>;

export interface RatioType {
  label: string;
  value: BigNumber;
}
