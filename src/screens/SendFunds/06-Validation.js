/* @flow */
import React, { useState, useCallback, useEffect, useRef } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { connect } from "react-redux";
import { SafeAreaView } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import { translate } from "react-i18next";
import i18next from "i18next";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import type {
  AccountLike,
  Account,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/lib/types";
import { getMainAccount } from "@ledgerhq/live-common/lib/account/helpers";
import { addPendingOperation } from "@ledgerhq/live-common/lib/account";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import type { DeviceModelId } from "@ledgerhq/devices";
import { updateAccountWithUpdater } from "../../actions/accounts";
import { accountAndParentScreenSelector } from "../../reducers/accounts";
import { TrackScreen } from "../../analytics";
import colors from "../../colors";
import StepHeader from "../../components/StepHeader";
import PreventNativeBack from "../../components/PreventNativeBack";
import ValidateOnDevice from "./ValidateOnDevice";
import SkipLock from "../../components/behaviour/SkipLock";
import logger from "../../logger";

const forceInset = { bottom: "always" };

type Props = {
  account: AccountLike,
  parentAccount: ?Account,
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

const useSignWithDevice = ({
  account,
  parentAccount,
  navigation,
  updateAccountWithUpdater,
}) => {
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const subscription = useRef(null);

  const signWithDevice = useCallback(() => {
    const deviceId = navigation.getParam("deviceId");
    const transaction = navigation.getParam("transaction");
    const bridge = getAccountBridge(account, parentAccount);
    const mainAccount = getMainAccount(account, parentAccount);

    const n = navigation.dangerouslyGetParent();
    if (n) n.setParams({ allowNavigation: false });
    setSigning(true);

    subscription.current = bridge
      .signAndBroadcast(mainAccount, transaction, deviceId)
      .subscribe({
        next: e => {
          switch (e.type) {
            case "signed":
              setSigned(true);
              break;

            case "broadcasted":
              // $FlowFixMe
              navigation.replace("SendValidationSuccess", {
                ...navigation.state.params,
                result: e.operation,
              });
              updateAccountWithUpdater(mainAccount.id, account =>
                addPendingOperation(account, e.operation),
              );
              break;

            default:
          }
        },
        error: e => {
          let error = e;
          if (e && e.statusCode === 0x6985) {
            error = new UserRefusedOnDevice();
          } else {
            logger.critical(error);
          }
          // $FlowFixMe
          navigation.replace("SendValidationError", {
            ...navigation.state.params,
            error,
          });
        },
      });
  }, [account, navigation, parentAccount, updateAccountWithUpdater]);

  useEffect(() => {
    signWithDevice();
    return () => {
      const n = navigation.dangerouslyGetParent();
      if (n) n.setParams({ allowNavigation: true });
      if (subscription.current) {
        subscription.current.unsubscribe();
      }
    };
    // only this effect on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [signing, signed];
};

const Validation = ({
  account,
  parentAccount,
  navigation,
  updateAccountWithUpdater,
}: Props) => {
  const [signing, signed] = useSignWithDevice({
    account,
    parentAccount,
    navigation,
    updateAccountWithUpdater,
  });

  const status = navigation.getParam("status");
  const modelId = navigation.getParam("modelId");
  const wired = navigation.getParam("wired");
  return (
    <SafeAreaView style={styles.root} forceInset={forceInset}>
      <TrackScreen category="SendFunds" name="Validation" signed={signed} />
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
          parentAccount={parentAccount}
          status={status}
        />
      )}
    </SafeAreaView>
  );
};

Validation.navigationOptions = {
  headerTitle: (
    <StepHeader
      title={i18next.t("send.stepperHeader.verification")}
      subtitle={i18next.t("send.stepperHeader.stepRange", {
        currentStep: "6",
        totalSteps: "6",
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
)(translate()(Validation));
