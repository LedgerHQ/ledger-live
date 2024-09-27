import type { ReactNode } from "react";

import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { MultiversxClaimRewardsFlowParamList } from "../../types";
import type { ScreenName } from "~/const";

export type PickMethodPropsType = StackNavigatorProps<
  MultiversxClaimRewardsFlowParamList,
  ScreenName.MultiversxClaimRewardsMethod
>;

export interface OptionType {
  value: string;
  label: ReactNode;
}

export interface ModalType {
  title: ReactNode;
  description: ReactNode;
}
