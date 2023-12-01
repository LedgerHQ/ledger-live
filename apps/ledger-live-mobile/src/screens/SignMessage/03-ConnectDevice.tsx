import invariant from "invariant";
import React, { useMemo } from "react";
import { StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import { getMainAccount } from "@ledgerhq/live-common/account/helpers";
import { accountScreenSelector } from "~/reducers/accounts";
import DeviceAction from "~/components/DeviceAction";
import { TrackScreen } from "~/analytics";
import { ScreenName } from "~/const";
import { navigateToSelectDevice } from "../ConnectDevice";
import { SignMessageNavigatorStackParamList } from "~/components/RootNavigator/types/SignMessageNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { useSignMessageDeviceAction } from "~/hooks/deviceActions";

export default function ConnectDevice({
  route,
  navigation,
}: StackNavigatorProps<SignMessageNavigatorStackParamList, ScreenName.SignConnectDevice>) {
  const action = useSignMessageDeviceAction();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  invariant(account, "account is required");
  const mainAccount = getMainAccount(account, parentAccount);

  const onResult:
    | ((_: {
        signature: string | null | undefined;
        error: Error | null | undefined;
      }) => void | Promise<void>)
    | undefined = result => {
    if (result.error) {
      navigation.navigate(ScreenName.SignValidationError, {
        ...route.params,
        error: result.error,
      });
    } else if (result.signature) {
      navigation.navigate(ScreenName.SignValidationSuccess, {
        ...route.params,
        signature: result.signature,
      });
    }
  };

  return useMemo(
    () => (
      <SafeAreaView style={styles.root}>
        <TrackScreen category={"SignMessage"} name="ConnectDevice" />
        <DeviceAction
          action={action}
          request={{
            account: mainAccount,
            appName: route.params.appName,
            message: route.params.message,
          }}
          device={route.params.device}
          onSelectDeviceLink={() => navigateToSelectDevice(navigation, route)}
          onResult={onResult}
        />
      </SafeAreaView>
    ), // prevent rerendering caused by optimistic update (i.e. exclude account related deps)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [route.params.message],
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 16,
  },
});
