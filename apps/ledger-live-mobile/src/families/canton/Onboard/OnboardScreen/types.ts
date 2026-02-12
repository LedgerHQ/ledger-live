import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { ScreenName } from "~/const";
import type { CantonOnboardAccountParamList } from "../types";

export type OnboardScreenProps = StackNavigatorProps<
  CantonOnboardAccountParamList,
  ScreenName.CantonOnboardAccount
>;

export type OnboardScreenViewModelParams = {
  navigation: OnboardScreenProps["navigation"];
  route: OnboardScreenProps["route"];
};
