// @flow
import invariant from "invariant";
import React, { useCallback } from "react";
import { View, StyleSheet, SafeAreaView } from "react-native";
import { Trans } from "react-i18next";
import { useSelector } from "react-redux";

import {
  getAccountUnit,
  getMainAccount,
} from "@ledgerhq/live-common/lib/account/helpers";
import { formatCurrencyUnit } from "@ledgerhq/live-common/lib/currencies/formatCurrencyUnit";
import useBridgeTransaction from "@ledgerhq/live-common/lib/bridge/useBridgeTransaction";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";

import { useTheme } from "@react-navigation/native";
import { ScreenName } from "../../../../const";
import Button from "../../../../components/Button";
import LText from "../../../../components/LText";
import { accountScreenSelector } from "../../../../reducers/accounts";
import NavigationScrollView from "../../../../components/NavigationScrollView";
import IlluRewards from "../../../../icons/images/Rewards";
import { TrackScreen } from "../../../../analytics";
import VerifyAddressDisclaimer from "../../../../components/VerifyAddressDisclaimer";
import TranslatedError from "../../../../components/TranslatedError";

type RouteParams = {
  accountId: string,
};

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

export default function DelegationStarted({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));

  invariant(account, "Account required");

  const mainAccount = getMainAccount(account, undefined);
  const bridge = getAccountBridge(mainAccount, undefined);

  invariant(
    mainAccount && mainAccount.algorandResources,
    "algorand Account required",
  );
  const { rewards } = mainAccount.algorandResources;

  const unit = getAccountUnit(mainAccount);

  const { transaction, status } = useBridgeTransaction(() => {
    const t = bridge.createTransaction(mainAccount);

    return {
      account,
      transaction: bridge.updateTransaction(t, {
        mode: "claimReward",
      }),
    };
  });

  const formattedRewards = formatCurrencyUnit(unit, rewards, {
    showCode: true,
    disableRounding: true,
  });

  const onNext = useCallback(() => {
    navigation.navigate(ScreenName.AlgorandClaimRewardsSelectDevice, {
      ...route.params,
      transaction,
    });
  }, [navigation, route.params, transaction]);

  const warning =
    status.warnings &&
    Object.keys(status.warnings).length > 0 &&
    Object.values(status.warnings)[0];

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <NavigationScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContainer}
      >
        <TrackScreen category="DelegationFlow" name="Started" />
        <IlluRewards />
        <LText semiBold style={styles.description}>
          <Trans
            secondary
            i18nKey="algorand.claimRewards.flow.steps.starter.title"
            values={{ amount: formattedRewards }}
          />
        </LText>
        <View style={styles.warning}>
          <VerifyAddressDisclaimer
            text={
              <Trans i18nKey="algorand.claimRewards.flow.steps.starter.warning" />
            }
          />
        </View>
      </NavigationScrollView>
      <View style={[styles.footer, { borderTopColor: colors.lightFog }]}>
        {warning && warning instanceof Error ? (
          <View style={styles.warningSection}>
            <LText
              selectable
              secondary
              semiBold
              style={styles.warningText}
              color="alert"
            >
              <TranslatedError error={warning} />
            </LText>
          </View>
        ) : null}
        <Button
          event="DelegationStartedBtn"
          onPress={onNext}
          title={
            <Trans i18nKey="algorand.claimRewards.flow.steps.starter.cta" />
          }
          type="primary"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingVertical: 32,
    alignItems: "center",
  },
  description: {
    fontSize: 16,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 16,
  },
  warning: {
    width: "100%",
    marginVertical: 8,
  },
  warningText: {
    textAlign: "center",
  },
  warningSection: { padding: 16, height: 80 },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
});
