/* @flow */
import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { connect } from "react-redux";
import { Trans } from "react-i18next";
import type { NavigationScreenProp } from "react-navigation";
import type { Account, Operation } from "@ledgerhq/live-common/lib/types";
import { accountAndParentScreenSelector } from "../../reducers/accounts";
import { TrackScreen } from "../../analytics";
import colors from "../../colors";
import PreventNativeBack from "../../components/PreventNativeBack";
import ValidateSuccess from "../../components/ValidateSuccess";

type Props = {
  account: Account,
  navigation: NavigationScreenProp<{
    params: {
      accountId: string,
      deviceId: string,
      transaction: *,
      result: Operation,
    },
  }>,
};

const ValidationSuccess = ({ navigation, account }: Props) => {
  const dismiss = useCallback(() => {
    if (navigation.dismiss) {
      const dismissed = navigation.dismiss();
      if (!dismissed) navigation.goBack();
    }
  }, [navigation]);

  const goToOperationDetails = useCallback(() => {
    if (!account) return;
    const result = navigation.getParam("result");
    if (!result) return;
    navigation.navigate("OperationDetails", {
      accountId: account.id,
      operation: result,
    });
  }, [navigation, account]);

  return (
    <View style={styles.root}>
      <TrackScreen category="ClaimRewards" name="ValidationSuccess" />
      <PreventNativeBack />
      <ValidateSuccess
        onClose={dismiss}
        onViewDetails={goToOperationDetails}
        title={<Trans i18nKey="claimReward.validation.success" />}
      />
    </View>
  );
};

ValidationSuccess.navigationOptions = {
  header: null,
  gesturesEnabled: false,
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  button: {
    alignSelf: "stretch",
    marginTop: 24,
  },
  labelContainer: {
    alignItems: "center",
    justifyContent: "flex-end",
    padding: 16,
  },
  label: { fontSize: 12 },
  subLabel: { color: colors.grey },
});

const mapStateToProps = accountAndParentScreenSelector;

export default connect(mapStateToProps)(ValidationSuccess);
