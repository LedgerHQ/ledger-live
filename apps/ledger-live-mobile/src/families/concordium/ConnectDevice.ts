import { useEffect } from "react";
import { ScreenName } from "~/const";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ReceiveFundsStackParamList } from "~/components/RootNavigator/types/ReceiveFundsNavigator";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";

type Navigation = StackNavigatorProps<ReceiveFundsStackParamList, ScreenName.ReceiveConnectDevice>;

type Props = Navigation;

export default function ConnectDevice({ navigation, route }: Props) {
  const { account } = useAccountScreen(route);

  useEffect(() => {
    if (!account) return;
    navigation.replace(ScreenName.ReceiveConfirmation, { ...route.params });
  }, [account, navigation, route.params]);

  return null;
}
