import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { HEDERA_TRANSACTION_MODES } from "@ledgerhq/live-common/families/hedera/constants";
import { Transaction } from "@ledgerhq/live-common/families/hedera/types";
import { View, SafeAreaView, StyleSheet } from "react-native";
import { useTokenByAddressInCurrency } from "@ledgerhq/cryptoassets/hooks";
import { getMainAccount } from "@ledgerhq/coin-framework/account/helpers";
import { useTheme } from "@react-navigation/native";
import invariant from "invariant";
import SummaryToSection from "./SummaryToSection";
import SummaryFromSection from "./SummaryFromSection";
import type { HederaAssociateTokenFlowParamList } from "./types";
import { TrackScreen } from "~/analytics";
import { ScreenName } from "~/const";
import Button from "~/components/Button";
import LText from "~/components/LText";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import NavigationScrollView from "~/components/NavigationScrollView";
import TranslatedError from "~/components/TranslatedError";
import Alert from "~/components/Alert";
import AssociationInsufficientFundsError from "~/families/hedera/AssociateTokenFlow/AssociationInsufficientFundsError";
import { urls } from "~/utils/urls";
import { useAccountScreen } from "~/hooks/useAccountScreen";

type Props = BaseComposite<
  StackNavigatorProps<HederaAssociateTokenFlowParamList, ScreenName.HederaAssociateTokenSummary>
>;

export default function Summary({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account, parentAccount } = useAccountScreen(route);

  const { tokenAddress } = route.params;
  const { token } = useTokenByAddressInCurrency(tokenAddress || "", "hedera");

  invariant(account, "hedera: account is required");
  invariant(token, `hedera: token with address ${tokenAddress} is not available`);
  const mainAccount = getMainAccount(account, parentAccount);

  const { transaction, status, bridgeError, bridgePending } = useBridgeTransaction(() => {
    const bridge = getAccountBridge(account, parentAccount);
    const transaction = bridge.createTransaction(account);
    const updatedTransaction = bridge.updateTransaction(transaction, {
      mode: HEDERA_TRANSACTION_MODES.TokenAssociate,
      assetReference: token.contractAddress,
      assetOwner: mainAccount.freshAddress,
      properties: {
        token,
      },
    } satisfies Partial<Transaction>);

    return {
      account,
      parentAccount,
      transaction: updatedTransaction,
    };
  });

  const navigateToNext = useCallback(() => {
    navigation.navigate(ScreenName.HederaAssociateTokenSelectDevice, {
      ...route.params,
      transaction,
    });
  }, [navigation, transaction, route]);

  const transactionError = status.errors.transaction;
  const error = status.errors[Object.keys(status.errors)[0]];

  return (
    <SafeAreaView style={styles.root}>
      <TrackScreen category="AssociateTokenFlow" name="Summary" currency="hedera" />
      <NavigationScrollView style={styles.body}>
        <SummaryFromSection token={token} />
        <View
          style={[
            styles.verticalConnector,
            {
              borderColor: colors.lightFog,
            },
          ]}
        />
        <SummaryToSection account={mainAccount} />
        <AssociationInsufficientFundsError status={status} />
      </NavigationScrollView>
      <LText style={styles.error} color="alert">
        <TranslatedError error={transactionError} />
      </LText>
      <View style={styles.footer}>
        <Alert
          type="warning"
          learnMoreUrl={urls.hedera.tokenAssociation}
          learnMoreKey="hedera.associate.summary.warning.learnMore"
        >
          <Trans i18nKey="hedera.associate.summary.warning.text" />
        </Alert>
        <Button
          event="HederaAssociateTokenSummaryContinue"
          type="primary"
          title={<Trans i18nKey="common.continue" />}
          containerStyle={styles.continueButton}
          onPress={navigateToNext}
          disabled={bridgePending || !!bridgeError || !!error}
          pending={bridgePending}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "column",
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "transparent",
  },
  footer: {
    gap: 32,
    flexDirection: "column",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  continueButton: {
    alignSelf: "stretch",
  },
  error: {
    fontSize: 12,
    marginBottom: 5,
  },
  verticalConnector: {
    position: "absolute",
    borderLeftWidth: 2,
    height: 20,
    top: -12,
    left: 16,
  },
});
