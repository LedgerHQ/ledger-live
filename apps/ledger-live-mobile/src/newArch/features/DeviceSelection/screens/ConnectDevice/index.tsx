import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useSelector } from "react-redux";

import { Flex } from "@ledgerhq/native-ui";
import {
  getAccountCurrency,
  getMainAccount,
  getReceiveFlowError,
} from "@ledgerhq/live-common/account/index";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";

import { accountScreenSelector } from "~/reducers/accounts";
import { ScreenName } from "~/const";
import { TrackScreen, track } from "~/analytics";
import SelectDevice2, { SetHeaderOptionsRequest } from "~/components/SelectDevice2";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";
import GenericErrorView from "~/components/GenericErrorView";
import DeviceActionModal from "~/components/DeviceActionModal";
// TODO: use byFamily in the next feature for device connection (scope Add account v2)
//import byFamily from "~/generated/ConnectDevice";

import {
  ReactNavigationHeaderOptions,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import { NavigationHeaderCloseButton } from "~/components/NavigationHeaderCloseButton";
import { NavigationHeaderBackButton } from "~/components/NavigationHeaderBackButton";
import { useAppDeviceAction } from "~/hooks/deviceActions";
import ReadOnlyWarning from "~/screens/ReceiveFunds/ReadOnlyWarning";
import NotSyncedWarning from "~/screens/ReceiveFunds/NotSyncedWarning";
import { DeviceSelectionNavigatorParamsList } from "../../types";
// TODO: use SkipSelectDevice in the next feature for device connection if needed (scope Add account v2)
//import SkipSelectDevice from "~/screens/SkipSelectDevice";

// Defines some of the header options for this screen to be able to reset back to them.
export const connectDeviceHeaderOptions = (
  onHeaderBackButtonPress: () => void,
): ReactNavigationHeaderOptions => ({
  headerRight: () => <NavigationHeaderCloseButton onPress={onHeaderBackButtonPress} />,
  headerLeft: () => <NavigationHeaderBackButton onPress={onHeaderBackButtonPress} />,
});

export default function ConnectDevice({
  navigation,
  route,
}: StackNavigatorProps<DeviceSelectionNavigatorParamsList, ScreenName.ConnectDevice>) {
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const [device, setDevice] = useState<Device | undefined>();
  const action = useAppDeviceAction();

  useEffect(() => {
    const readOnlyTitle = "transfer.receive.titleReadOnly";
    if (readOnlyModeEnabled && route.params?.title !== readOnlyTitle) {
      navigation.setParams({
        title: readOnlyTitle,
      });
    }
  }, [navigation, readOnlyModeEnabled, route.params]);

  const error = useMemo(
    () => (account ? getReceiveFlowError(account, parentAccount) : null),
    [account, parentAccount],
  );

  const onResult = () => {
    // TODO: implement business logic for both Add account v2 and Receive flow
  };

  const onSkipDevice = useCallback(() => {
    if (!account) return;
    // TODO: implement business logic for both Add account v2 and Receive flow
  }, [account]);

  const onClose = useCallback(() => {
    setDevice(undefined);
  }, []);

  const onHeaderBackButtonPress = useCallback(() => {
    track("button_clicked", {
      button: "Back arrow",
      page: ScreenName.ReceiveConnectDevice,
    });
    navigation.goBack();
  }, [navigation]);

  // Reacts from request to update the screen header
  const requestToSetHeaderOptions = useCallback(
    (request: SetHeaderOptionsRequest) => {
      if (request.type === "set") {
        navigation.setOptions({
          headerLeft: request.options.headerLeft,
          headerRight: request.options.headerRight,
        });
      } else {
        // Sets back the header to its initial values set for this screen
        navigation.setOptions({
          ...connectDeviceHeaderOptions(onHeaderBackButtonPress),
        });
      }
    },
    [navigation, onHeaderBackButtonPress],
  );

  if (!account) return null;

  if (error) {
    return (
      <View style={styles.bodyError}>
        <GenericErrorView error={error} />
      </View>
    );
  }

  const mainAccount = getMainAccount(account, parentAccount);
  const currency = getAccountCurrency(mainAccount);
  if (currency.type !== "CryptoCurrency") return null; // this should not happen: currency of main account is a crypto currency
  const tokenCurrency = account && account.type === "TokenAccount" ? account.token : undefined;

  // check for coin specific UI
  // TODO: implement business logic for both Add account v2 and Receive flow
  //const CustomConnectDevice = byFamily[currency.family as keyof typeof byFamily];
  //if (CustomConnectDevice) return <CustomConnectDevice {...{ navigation, route }} />;

  if (readOnlyModeEnabled) {
    return <ReadOnlyWarning continue={onSkipDevice} />;
  }

  if (!mainAccount.freshAddress) {
    return <NotSyncedWarning accountId={mainAccount.id} />;
  }

  return (
    <>
      <TrackScreen category="Deposit" name="Device Selection" />
      {/* 
      * TODO: implement business logic for both Add account v2 and Receive flow
      <SkipSelectDevice route={route} onResult={setDevice} /> 
      */}
      <Flex px={16} py={5} flex={1}>
        <SelectDevice2
          onSelect={setDevice}
          stopBleScanning={!!device}
          requestToSetHeaderOptions={requestToSetHeaderOptions}
        />
      </Flex>
      <DeviceActionModal
        action={action}
        device={device}
        onResult={onResult}
        onClose={onClose}
        request={{ account: mainAccount, tokenCurrency }}
        onSelectDeviceLink={() => setDevice(undefined)}
        analyticsPropertyFlow="receive"
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  bodyError: {
    flex: 1,
    flexDirection: "column",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 16,
  },
  scroll: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
  },
});
