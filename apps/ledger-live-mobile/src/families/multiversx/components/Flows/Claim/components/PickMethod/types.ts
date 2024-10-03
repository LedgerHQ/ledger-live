import type { ReactNode } from "react";

import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { MultiversXClaimRewardsFlowParamList } from "../../types";
import type { ScreenName } from "~/const";

export type PickMethodPropsType = StackNavigatorProps<
  MultiversXClaimRewardsFlowParamList,
  ScreenName.MultiversXClaimRewardsMethod
>;

export interface OptionType {
  value: string;
  label: ReactNode;
}

export interface ModalType {
  title: ReactNode;
  description: ReactNode;
}
