import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import {
  getAccountCurrency,
  getMainAccount,
  getReceiveFlowError,
} from "@ledgerhq/live-common/account/index";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { AccountLike } from "@ledgerhq/types-live";
import { createAction } from "@ledgerhq/live-common/hw/actions/app";
import connectApp from "@ledgerhq/live-common/hw/connectApp";

import { useRoute } from "@react-navigation/native";
import { accountScreenSelector } from "../../reducers/accounts";
import { ScreenName } from "../../const";
import { TrackScreen } from "../../analytics";
import SelectDevice from "../../components/SelectDevice";
import NavigationScrollView from "../../components/NavigationScrollView";
import { readOnlyModeEnabledSelector } from "../../reducers/settings";
import ReadOnlyWarning from "./ReadOnlyWarning";
import NotSyncedWarning from "./NotSyncedWarning";
import GenericErrorView from "../../components/GenericErrorView";
import DeviceActionModal from "../../components/DeviceActionModal";
import SkipSelectDevice from "../SkipSelectDevice";
import byFamily from "../../generated/ConnectDevice";

type Props = {
  navigation: any;
  route: { params: RouteParams };
};

type RouteParams = {
  account?: AccountLike;
  accountId: string;
  parentId?: string;
  notSkippable?: boolean;
  title: string;
  appName?: string;
  onSuccess?: () => void;
  onError?: () => void;
};

const action = createAction(connectApp);

export default function ConnectDevice({ navigation, route }: Props) {
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const [device, setDevice] = useState<Device | undefined>();
  const routerRoute = useRoute();

  useEffect(() => {
    const readOnlyTitle = "transfer.receive.titleReadOnly";
    if (readOnlyModeEnabled && route.params?.title !== readOnlyTitle) {
      navigation.setParams({
        title: readOnlyTitle,
        headerRight: null,
      });
    }
  }, [navigation, readOnlyModeEnabled, route.params]);

  const error = useMemo(
    () => (account ? getReceiveFlowError(account, parentAccount) : null),
    [account, parentAccount],
  );

  const onResult = useCallback(
    // eslint-disable-next-line consistent-return
    payload => {
      if (!account) {
        return null;
      }
      setDevice();
      navigation.navigate(ScreenName.ReceiveVerifyAddress, {
        ...route.params,
        ...payload,
      });
    },
    [navigation, route.params, account],
  );

  const onSkipDevice = useCallback(() => {
    if (!account) return;
    navigation.navigate(ScreenName.ReceiveConfirmation, {
      ...route.params,
    });
  }, [account, navigation, route.params]);

  const onClose = useCallback(() => {
    setDevice();
  }, []);

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
  const tokenCurrency =
    account && account.type === "TokenAccount" && account.token;

  // check for coin specific UI
  const CustomConnectDevice = byFamily[currency.family];
  if (CustomConnectDevice)
    return <CustomConnectDevice {...{ navigation, route }} />;

  if (readOnlyModeEnabled) {
    return <ReadOnlyWarning continue={onSkipDevice} />;
  }

  if (!mainAccount.freshAddress) {
    return (
      <NotSyncedWarning continue={onSkipDevice} accountId={mainAccount.id} />
    );
  }

  return (
    <>
      <TrackScreen
        category="ReceiveFunds"
        name="Device Selection"
        source={routerRoute.name}
      />
      <NavigationScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContainer}
      >
        <SkipSelectDevice route={route} onResult={setDevice} />
        <SelectDevice
          onSelect={setDevice}
          onWithoutDevice={
            route.params?.notSkippable ? undefined : onSkipDevice
          }
        />
      </NavigationScrollView>
      <DeviceActionModal
        action={action}
        device={device}
        onResult={onResult}
        onClose={onClose}
        request={{ account: mainAccount, tokenCurrency }}
        appName={route.params.appName}
        onSelectDeviceLink={() => setDevice()}
        onModalHide={() => setDevice()}
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
