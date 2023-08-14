import { useSelector } from "react-redux";
import { accountScreenSelector } from "../../reducers/accounts";
import { ScreenName } from "../../const";
import { StackNavigatorProps } from "../../components/RootNavigator/types/helpers";
import { ReceiveFundsStackParamList } from "../../components/RootNavigator/types/ReceiveFundsNavigator";

type Navigation = StackNavigatorProps<ReceiveFundsStackParamList, ScreenName.ReceiveConnectDevice>;

type Props = Navigation;

export default function ConnectDevice({ navigation, route }: Props) {
  const { account } = useSelector(accountScreenSelector(route));
  if (!account) return null;
  // skip verifying device
  navigation.navigate(ScreenName.ReceiveConfirmation, { ...route.params });
  return null;
}
