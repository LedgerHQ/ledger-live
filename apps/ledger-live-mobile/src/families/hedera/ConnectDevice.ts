import { ScreenName } from "../../const";
import { StackNavigatorProps } from "../../components/RootNavigator/types/helpers";
import { ReceiveFundsStackParamList } from "../../components/RootNavigator/types/ReceiveFundsNavigator";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";

type Navigation = StackNavigatorProps<ReceiveFundsStackParamList, ScreenName.ReceiveConnectDevice>;

type Props = Navigation;

export default function ConnectDevice({ navigation, route }: Props) {
  const { account } = useAccountScreen(route);
  if (!account) return null;
  // skip verifying device
  navigation.navigate(ScreenName.ReceiveConfirmation, { ...route.params });
  return null;
}
