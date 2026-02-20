import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { ScreenName } from "~/const";
import type { CantonOnboardStackParamList } from "../types";

export type OnboardScreenProps = StackNavigatorProps<
  CantonOnboardStackParamList,
  ScreenName.CantonOnboardMain
>;

export type OnboardScreenViewModelParams = {
  navigation: OnboardScreenProps["navigation"];
  route: OnboardScreenProps["route"];
};
