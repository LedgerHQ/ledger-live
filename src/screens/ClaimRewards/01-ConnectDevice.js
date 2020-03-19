// @flow
import React, { useCallback } from "react";
import { StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-navigation";
import { connect } from "react-redux";
import { compose } from "redux";
import { translate } from "react-i18next";
import i18next from "i18next";

import type { NavigationScreenProp } from "react-navigation";
import type { Account, Transaction } from "@ledgerhq/live-common/lib/types";

import useBridgeTransaction from "@ledgerhq/live-common/lib/bridge/useBridgeTransaction";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import { getMainAccount } from "@ledgerhq/live-common/lib/account/helpers";
import { accountAndParentScreenSelector } from "../../reducers/accounts";

import colors from "../../colors";
import { TrackScreen } from "../../analytics";
import StepHeader from "../../components/StepHeader";
import SelectDevice from "../../components/SelectDevice";
import { connectingStep, accountApp } from "../../components/DeviceJob/steps";

const forceInset = { bottom: "always" };

type Props = {
  account: Account,
  parentAccount: ?Account,
  navigation: NavigationScreenProp<{
    params: {
      accountId: string,
      parentId: string,
      transaction: Transaction,
    },
  }>,
};

const ConnectDevice = ({ account, parentAccount, navigation }: Props) => {
  const bridge = getAccountBridge(account, parentAccount);

  const { transaction, status } = useBridgeTransaction(() => {
    const t = bridge.createTransaction(account);

    const transaction = bridge.updateTransaction(t, {
      mode: "claimReward",
    });

    return { account, parentAccount, transaction };
  });

  const onSelectDevice = useCallback(
    (meta: *) => {
      // $FlowFixMe
      navigation.replace("ClaimRewardsValidation", {
        ...navigation.state.params,
        ...meta,
        transaction,
        status,
      });
    },
    [navigation, transaction],
  );

  if (!account) return null;
  const mainAccount = getMainAccount(account, parentAccount);
  return (
    <SafeAreaView style={styles.root} forceInset={forceInset}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContainer}
      >
        <TrackScreen category="ClaimRewards" name="ConnectDevice" />
        <SelectDevice
          onSelect={onSelectDevice}
          steps={[connectingStep, accountApp(mainAccount)]}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scroll: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
  },
});

ConnectDevice.navigationOptions = {
  headerTitle: (
    <StepHeader
      title={i18next.t("claimReward.stepperHeader.connectDevice")}
      subtitle={i18next.t("claimReward.stepperHeader.stepRange", {
        currentStep: "2",
        totalSteps: "3",
      })}
    />
  ),
};

const mapStateToProps = accountAndParentScreenSelector;

export default compose(
  connect(mapStateToProps),
  translate(),
)(ConnectDevice);
