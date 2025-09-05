import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CompositeScreenProps } from "@react-navigation/native";
import { ScreenName } from "~/const";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { RootStackParamList } from "~/components/RootNavigator/types/RootNavigator";
import { SyncOnboardingStackParamList } from "~/components/RootNavigator/types/SyncOnboardingNavigator";

export type SyncOnboardingScreenProps = CompositeScreenProps<
  NativeStackScreenProps<SyncOnboardingStackParamList, ScreenName.SyncOnboardingCompanion>,
  CompositeScreenProps<
    NativeStackScreenProps<BaseNavigatorStackParamList>,
    NativeStackScreenProps<RootStackParamList>
  >
>;
