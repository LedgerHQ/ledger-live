/* @flow */
import React from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { connect } from "react-redux";
import { SafeAreaView } from "react-navigation";

import type { NavigationScreenProp } from "react-navigation";
import i18next from "i18next";
import type {
  Account,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/lib/types";
import type { DeviceModelId } from "@ledgerhq/devices";

import { useSignWithDevice } from "../../logic/screenTransactionHooks";
import { updateAccountWithUpdater } from "../../actions/accounts";
import { accountAndParentScreenSelector } from "../../reducers/accounts";
import { TrackScreen } from "../../analytics";
import colors from "../../colors";
import StepHeader from "../../components/StepHeader";
import PreventNativeBack from "../../components/PreventNativeBack";
import ValidateOnDevice from "../../components/ValidateOnDevice";
import SkipLock from "../../components/behaviour/SkipLock";

const forceInset = { bottom: "always" };

type Props = {
  account: Account,
  updateAccountWithUpdater: (string, (Account) => Account) => void,
  navigation: NavigationScreenProp<{
    params: {
      accountId: string,
      deviceId: string,
      modelId: DeviceModelId,
      wired: boolean,
      transaction: Transaction,
      status: TransactionStatus,
    },
  }>,
};

const Validation = ({
  account,
  navigation,
  updateAccountWithUpdater,
}: Props) => {
  const [signing, signed] = useSignWithDevice({
    context: "Freeze",
    account,
    parentAccount: undefined,
    navigation,
    updateAccountWithUpdater,
  });

  const status = navigation.getParam("status");
  const transaction = navigation.getParam("transaction");
  const modelId = navigation.getParam("modelId");
  const wired = navigation.getParam("wired");

  return (
    <SafeAreaView style={styles.root} forceInset={forceInset}>
      <TrackScreen category="FreezeFunds" name="Validation" signed={signed} />
      {signing && (
        <>
          <PreventNativeBack />
          <SkipLock />
        </>
      )}

      {signed ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <ValidateOnDevice
          wired={wired}
          modelId={modelId}
          account={account}
          parentAccount={undefined}
          status={status}
          transaction={transaction}
        />
      )}
    </SafeAreaView>
  );
};

Validation.navigationOptions = {
  headerTitle: (
    <StepHeader
      title={i18next.t("freeze.stepperHeader.verification")}
      subtitle={i18next.t("freeze.stepperHeader.stepRange", {
        currentStep: "3",
        totalSteps: "3",
      })}
    />
  ),
  headerLeft: null,
  headerRight: null,
  gesturesEnabled: false,
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  center: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
});

const mapStateToProps = accountAndParentScreenSelector;

const mapDispatchToProps = {
  updateAccountWithUpdater,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Validation);
