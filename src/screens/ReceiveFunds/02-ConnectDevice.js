// @flow
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, StyleSheet } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  getMainAccount,
  getReceiveFlowError,
  getAccountCurrency,
} from "@ledgerhq/live-common/lib/account";
import type { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import type { AccountLike } from "@ledgerhq/live-common/lib/types";
import { createAction } from "@ledgerhq/live-common/lib/hw/actions/app";
import connectApp from "@ledgerhq/live-common/lib/hw/connectApp";

import { useTheme } from "@react-navigation/native";
import { accountScreenSelector } from "../../reducers/accounts";
import { ScreenName } from "../../const";
import { TrackScreen } from "../../analytics";
import SelectDevice from "../../components/SelectDevice";
import Button from "../../components/Button";
import NavigationScrollView from "../../components/NavigationScrollView";
import { readOnlyModeEnabledSelector } from "../../reducers/settings";
import ReadOnlyWarning from "./ReadOnlyWarning";
import NotSyncedWarning from "./NotSyncedWarning";
import GenericErrorView from "../../components/GenericErrorView";
import DeviceActionModal from "../../components/DeviceActionModal";
import { renderVerifyAddress } from "../../components/DeviceAction/rendering";

const forceInset = { bottom: "always" };

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

type RouteParams = {
  account?: AccountLike,
  accountId: string,
  parentId?: string,
  title: string,
};

const action = createAction(connectApp);

export default function ConnectDevice({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const [device, setDevice] = useState<?Device>();

  const { colors } = useTheme();

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
      accountId: account.id,
      parentId: parentAccount && parentAccount.id,
    });
  }, [account, navigation, parentAccount]);

  const onClose = useCallback(() => {
    setDevice();
  }, []);

  if (!account) return null;

  if (error) {
    return (
      <SafeAreaView style={styles.root} forceInset={forceInset}>
        <View style={styles.bodyError}>
          <GenericErrorView error={error} />
        </View>
      </SafeAreaView>
    );
  }

  const mainAccount = getMainAccount(account, parentAccount);
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
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
      forceInset={forceInset}
    >
      <TrackScreen category="ReceiveFunds" name="ConnectDevice" />
      <NavigationScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContainer}
      >
        <SelectDevice onSelect={setDevice} />
      </NavigationScrollView>
      <View
        style={[
          styles.footer,
          {
            borderTopColor: colors.lightFog,
          },
        ]}
      >
        <Button
          event="ReceiveWithoutDevice"
          type="lightSecondary"
          title={t("transfer.receive.withoutDevice")}
          onPress={onSkipDevice}
        />
      </View>

      <DeviceActionModal
        action={action}
        device={device}
        onResult={onResult}
        onClose={onClose}
        request={{ account: mainAccount, tokenCurrency }}
      />
    </SafeAreaView>
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
  footer: {
    padding: 4,
    borderTopWidth: 1,
  },
});
