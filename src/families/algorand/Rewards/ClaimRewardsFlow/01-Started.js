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

import colors from "../../../../colors";
import { ScreenName } from "../../../../const";
import Button from "../../../../components/Button";
import LText from "../../../../components/LText";
import { accountScreenSelector } from "../../../../reducers/accounts";
import NavigationScrollView from "../../../../components/NavigationScrollView";
import IlluRewards from "../../../../icons/images/Rewards";
import { TrackScreen } from "../../../../analytics";
import VerifyAddressDisclaimer from "../../../../components/VerifyAddressDisclaimer";

type RouteParams = {
  accountId: string,
};

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

export default function DelegationStarted({ navigation, route }: Props) {
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

  const { transaction, bridgePending, bridgeError } = useBridgeTransaction(
    () => {
      const t = bridge.createTransaction(mainAccount);

      return {
        account,
        transaction: bridge.updateTransaction(t, {
          mode: "claimReward",
        }),
      };
    },
  );

  const formattedRewards = formatCurrencyUnit(unit, rewards, {
    showCode: true,
    disableRounding: true,
  });

  const onNext = useCallback(() => {
    navigation.navigate(ScreenName.AlgorandClaimRewardsConnectDevice, {
      ...route.params,
      transaction,
    });
  }, [navigation, route.params, transaction]);

  const onCancel = useCallback(() => {
    navigation.dangerouslyGetParent().pop();
  }, [navigation]);

  return (
    <SafeAreaView style={styles.root}>
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
      </NavigationScrollView>
      <View style={styles.footer}>
        <View style={styles.warning}>
          <VerifyAddressDisclaimer
            text={
              <Trans i18nKey="algorand.claimRewards.flow.steps.starter.warning" />
            }
          />
        </View>
        <Button
          event="DelegationStartedBtn"
          onPress={onNext}
          title={
            <Trans i18nKey="algorand.claimRewards.flow.steps.starter.cta" />
          }
          type="primary"
        />
        <Button
          event="DelegationStartedCancel"
          disabled={bridgePending || !!bridgeError}
          onPress={onCancel}
          title={<Trans i18nKey="common.cancel" />}
          type="darkSecondary"
          outline={false}
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
  scroll: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 32,
    paddingVertical: 32,
    alignItems: "center",
  },
  description: {
    fontSize: 16,
    lineHeight: 21,
    color: colors.darkBlue,
    textAlign: "center",
    marginTop: 16,
  },
  howDelegationWorks: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderColor: colors.live,
    flexDirection: "row",
  },
  howDelegationWorksText: {
    color: colors.live,
    fontSize: 14,
  },
  warning: {
    width: "100%",
    marginVertical: 8,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.lightFog,
  },
});
