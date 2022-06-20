// @flow
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  getMainAccount,
  getReceiveFlowError,
  getAccountCurrency,
} from "@ledgerhq/live-common/account/index";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { AccountLike } from "@ledgerhq/live-common/types/index";
import { createAction } from "@ledgerhq/live-common/hw/actions/app";
import connectApp from "@ledgerhq/live-common/hw/connectApp";

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
import { renderVerifyAddress } from "../../components/DeviceAction/rendering";
import SkipSelectDevice from "../SkipSelectDevice";

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

type RouteParams = {
  account?: AccountLike,
  accountId: string,
  parentId?: string,
  title: string,
  appName?: string,
  onSuccess?: () => void,
  onError?: () => void,
};

const action = createAction(connectApp);

export default function ConnectDevice({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const [device, setDevice] = useState<?Device>();

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
    payload => {
      if (!account) {
        return null;
      }
      return renderVerifyAddress({
        t,
        navigation,
        currencyName: getAccountCurrency(account).name,
        device: payload.device,
        onPress: () => {
          setDevice();
          navigation.navigate(ScreenName.ReceiveConfirmation, {
            ...route.params,
            ...payload,
          });
        },
      });
    },
    [navigation, t, route.params, account],
  );

  const onSkipDevice = useCallback(() => {
    if (!account) return;
    navigation.navigate(ScreenName.ReceiveConfirmation, {
      ...route.params,
    });
  }, [account, navigation, parentAccount]);

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
  const currency = getAccountCurrency(account);
  const tokenCurrency =
    account && account.type === "TokenAccount" && account.token;

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
        name="ConnectDevice"
        currencyName={currency.name}
      />
      <NavigationScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContainer}
      >
        <SkipSelectDevice route={route} onResult={setDevice} />
        <SelectDevice
          onSelect={setDevice}
          onWithoutDevice={onSkipDevice}
          withoutDevice
        />
      </NavigationScrollView>
      <DeviceActionModal
        action={action}
        device={device}
        renderOnResult={onResult}
        onClose={onClose}
        request={{ account: mainAccount, tokenCurrency }}
        appName={route.params.appName}
        onSelectDeviceLink={() => setDevice()}
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
