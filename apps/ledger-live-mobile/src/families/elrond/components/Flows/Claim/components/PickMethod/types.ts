import type { ReactNode } from "react";

import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { ElrondClaimRewardsFlowParamList } from "../../types";
import type { ScreenName } from "~/const";

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
