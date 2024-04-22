import type { StackScreenProps } from "@react-navigation/stack";
import { CompositeScreenProps } from "@react-navigation/native";
import { ScreenName } from "~/const";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { RootStackParamList } from "~/components/RootNavigator/types/RootNavigator";
import { SyncOnboardingStackParamList } from "~/components/RootNavigator/types/SyncOnboardingNavigator";

export type SyncOnboardingScreenProps = CompositeScreenProps<
  StackScreenProps<SyncOnboardingStackParamList, ScreenName.SyncOnboardingCompanion>,
  CompositeScreenProps<
    StackScreenProps<BaseNavigatorStackParamList>,
    StackScreenProps<RootStackParamList>
  >
>;
