// @flow
import React, { useCallback, useEffect, useMemo } from "react";
import i18next from "i18next";
import { View, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-navigation";
import { connect } from "react-redux";
import { compose } from "redux";
import { translate, Trans } from "react-i18next";
import type { NavigationScreenProp } from "react-navigation";
import type { Account, TokenAccount } from "@ledgerhq/live-common/lib/types";
import {
  getMainAccount,
  getReceiveFlowError,
} from "@ledgerhq/live-common/lib/account";
import { accountAndParentScreenSelector } from "../../reducers/accounts";
import colors from "../../colors";
import { TrackScreen } from "../../analytics";
import StepHeader from "../../components/StepHeader";
import SelectDevice from "../../components/SelectDevice";
import Button from "../../components/Button";
import {
  connectingStep,
  accountApp,
  receiveVerifyStep,
} from "../../components/DeviceJob/steps";
import { readOnlyModeEnabledSelector } from "../../reducers/settings";
import ReadOnlyWarning from "./ReadOnlyWarning";
import NotSyncedWarning from "./NotSyncedWarning";
import GenericErrorView from "../../components/GenericErrorView";

const forceInset = { bottom: "always" };

type Navigation = NavigationScreenProp<{
  params: {
    accountId: string,
    parentId: string,
  },
}>;

type Props = {
  account: ?(TokenAccount | Account),
  parentAccount: ?Account,
  navigation: Navigation,
  readOnlyModeEnabled: boolean,
};

const mapStateToProps = (s, p) => ({
  ...accountAndParentScreenSelector(s, p),
  readOnlyModeEnabled: readOnlyModeEnabledSelector(s),
});

const ConnectDevice = ({
  readOnlyModeEnabled,
  navigation,
  account,
  parentAccount,
}: Props) => {
  useEffect(() => {
    if (readOnlyModeEnabled) {
      navigation.setParams({
        title: "transfer.receive.titleReadOnly",
        headerRight: null,
      });
    }
  }, [navigation, readOnlyModeEnabled]);

  const error = useMemo(
    () => (account ? getReceiveFlowError(account, parentAccount) : null),
    [account, parentAccount],
  );

  const onSelectDevice = useCallback(
    (meta: *) => {
      if (!account) return;
      navigation.navigate("ReceiveConfirmation", {
        accountId: account.id,
        parentId: parentAccount && parentAccount.id,
        ...meta,
      });
    },
    [account, navigation, parentAccount],
  );

  const onSkipDevice = useCallback(() => {
    if (!account) return;
    navigation.navigate("ReceiveConfirmation", {
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
      <ScrollView
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
      </ScrollView>
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
};

ConnectDevice.navigationOptions = ({ navigation }) => {
  const { params } = navigation.state;
  const key = (params && params.title) || "transfer.receive.titleDevice";

  return {
    headerTitle: (
      <StepHeader
        title={i18next.t(key)}
        subtitle={i18next.t("send.stepperHeader.stepRange", {
          currentStep: "2",
          totalSteps: "3",
        })}
      />
    ),
  };
};

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

export default compose(
  connect(mapStateToProps),
  translate(),
)(ConnectDevice);
