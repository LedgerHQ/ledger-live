import { RouteProp } from "@react-navigation/native";
import { ScreenName } from "~/const";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";

export type Navigation = StackNavigatorNavigation<SendFundsNavigatorStackParamList>;

export type RouteProps = RouteProp<SendFundsNavigatorStackParamList, ScreenName.EvmCustomFees>;
