import { RouteProp, CompositeScreenProps } from "@react-navigation/native";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";

export type Navigation = CompositeScreenProps<
  StackNavigatorProps<SendFundsNavigatorStackParamList>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

export type RouteProps = RouteProp<SendFundsNavigatorStackParamList>;
