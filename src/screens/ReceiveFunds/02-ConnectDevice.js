// @flow
import React, { useCallback, useEffect, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import {
  getMainAccount,
  getReceiveFlowError,
} from "@ledgerhq/live-common/lib/account";
import { accountScreenSelector } from "../../reducers/accounts";
import colors from "../../colors";
import { ScreenName } from "../../const";
import { TrackScreen } from "../../analytics";
import SelectDevice from "../../components/SelectDevice";
import Button from "../../components/Button";
import {
  connectingStep,
  accountApp,
  receiveVerifyStep,
} from "../../components/DeviceJob/steps";
import NavigationScrollView from "../../components/NavigationScrollView";
import { readOnlyModeEnabledSelector } from "../../reducers/settings";
import ReadOnlyWarning from "./ReadOnlyWarning";
import NotSyncedWarning from "./NotSyncedWarning";
import GenericErrorView from "../../components/GenericErrorView";

const forceInset = { bottom: "always" };

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

type RouteParams = {
  accountId: string,
  parentId: string,
  title: string,
};

export default function ConnectDevice({ navigation, route }: Props) {
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);

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

  const onSelectDevice = useCallback(
    (meta: *) => {
      if (!account) return;
      navigation.navigate(ScreenName.ReceiveConfirmation, {
        accountId: account.id,
        parentId: parentAccount && parentAccount.id,
        ...meta,
      });
    },
    [account, navigation, parentAccount],
  );

  const onSkipDevice = useCallback(() => {
    if (!account) return;
    navigation.navigate(ScreenName.ReceiveConfirmation, {
      accountId: account.id,
      parentId: parentAccount && parentAccount.id,
    });
  }, [account, navigation, parentAccount]);

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

  if (readOnlyModeEnabled) {
    return <ReadOnlyWarning continue={onSkipDevice} />;
  }

  if (!mainAccount.freshAddress) {
    return (
      <NotSyncedWarning continue={onSkipDevice} accountId={mainAccount.id} />
    );
  }

  return (
    <SafeAreaView style={styles.root} forceInset={forceInset}>
      <TrackScreen category="ReceiveFunds" name="ConnectDevice" />
      <NavigationScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContainer}
      >
        <SelectDevice
          onSelect={onSelectDevice}
          steps={[
            connectingStep,
            accountApp(mainAccount),
            receiveVerifyStep(mainAccount),
          ]}
        />
      </NavigationScrollView>
      <View style={styles.footer}>
        <Button
          event="ReceiveWithoutDevice"
          type="lightSecondary"
          title={<Trans i18nKey="transfer.receive.withoutDevice" />}
          onPress={onSkipDevice}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
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
    borderTopColor: colors.lightFog,
  },
});
