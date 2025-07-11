import React, { useCallback } from "react";
import invariant from "invariant";
import { useSelector } from "react-redux";
import { StyleSheet, View } from "react-native";
import { Trans } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import { Text } from "@ledgerhq/native-ui";
import type { AccountBridge } from "@ledgerhq/types-live";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/impl";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import type { Transaction } from "@ledgerhq/live-common/families/hedera/types";
import { TrackScreen } from "~/analytics";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import Button from "~/components/Button";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import TranslatedError from "~/components/TranslatedError";
import Alert from "~/components/Alert";
import { ScreenName } from "~/const";
import { useAccountUnit } from "~/hooks";
import { accountScreenSelector } from "~/reducers/accounts";
import { urls } from "~/utils/urls";
import type { HederaRedelegationFlowParamList } from "./types";
import ReadonlyAmountRatio from "../shared/ReadonlyAmountRatio";

type Props = StackNavigatorProps<
  HederaRedelegationFlowParamList,
  ScreenName.HederaRedelegationAmount
>;

function RedelegationAmount({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));

  invariant(account, "account must be defined");
  invariant(account.type === "Account", "account type must be Account");

  const unit = useAccountUnit(account);
  const bridge: AccountBridge<Transaction> = getAccountBridge(account);
  const { transaction, status, bridgePending, bridgeError } = useBridgeTransaction(() => {
    const t = bridge.createTransaction(account);

    const transaction = bridge.updateTransaction(t, {
      properties: {
        name: "staking",
        mode: "redelegate",
        stakedNodeId: route.params.selectedValidator.nodeId,
      } as const,
    });

    return {
      account,
      parentAccount: undefined,
      transaction,
    };
  });

  invariant(transaction, "transaction must be defined");
  invariant(transaction.family === "hedera", "transaction hedera");

  const onContinue = useCallback(async () => {
    navigation.navigate(ScreenName.HederaRedelegationSelectDevice, {
      ...route.params,
      transaction,
      status,
    });
  }, [transaction, status, route.params, navigation]);

  const hasErrors = Object.keys(status.errors).length > 0;
  const error = Object.values(status.errors)[0];

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="RedelegationFlow"
        name="Amount"
        flow="stake"
        action="redelegation"
        currency="hedera"
      />
      <View style={styles.body}>
        <View style={styles.amount}>
          <View>
            <Text
              fontWeight="semiBold"
              numberOfLines={1}
              fontSize={32}
              textAlign="center"
              adjustsFontSizeToFit
            >
              <CurrencyUnitValue
                showCode
                unit={unit}
                value={route.params.delegationWithMeta.delegated}
              />
            </Text>
            <ReadonlyAmountRatio text="100%" />
          </View>
        </View>
        <View>
          <Alert
            type="primary"
            learnMoreKey="hedera.redelegation.steps.amount.learnMore"
            learnMoreUrl={urls.hedera.staking}
          >
            <Trans i18nKey="hedera.redelegation.steps.amount.alert" />
          </Alert>
        </View>
      </View>
      <View style={styles.footer}>
        <Text color="alert" fontWeight="semiBold" textAlign="center" mb={6}>
          <TranslatedError error={error} />
        </Text>
        <Button
          event="AmountContinue"
          type="primary"
          title={<Trans i18nKey="common.continue" />}
          containerStyle={styles.continueButton}
          onPress={onContinue}
          disabled={bridgePending || !!bridgeError || hasErrors}
          pending={bridgePending}
          testID="hedera-amount-continue-button"
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
  },
  amount: {
    flexGrow: 1,
    justifyContent: "center",
  },
  footer: {
    flexDirection: "column",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  continueButton: {
    alignSelf: "stretch",
  },
});

export default RedelegationAmount;
