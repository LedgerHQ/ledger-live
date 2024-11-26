import { RouteProp, CompositeScreenProps } from "@react-navigation/native";
import { ScreenName } from "../../const";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";

export type Navigation = CompositeScreenProps<
  StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.AptosCustomFees>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

export type RouteProps = RouteProp<SendFundsNavigatorStackParamList, ScreenName.AptosCustomFees>;
