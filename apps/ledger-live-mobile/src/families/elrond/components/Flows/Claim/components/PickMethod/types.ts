import { ReactNode } from "react";

import { StackNavigatorProps } from "../../../../../../../components/RootNavigator/types/helpers";
import { ElrondClaimRewardsFlowParamList } from "../../types";
import { ScreenName } from "../../../../../../../const";

export type PickMethodPropsType = StackNavigatorProps<
  ElrondClaimRewardsFlowParamList,
  ScreenName.ElrondClaimRewardsMethod
>;

export interface OptionType {
  value: string;
  label: ReactNode;
}

export interface ModalType {
  title: ReactNode;
  description: ReactNode;
}
