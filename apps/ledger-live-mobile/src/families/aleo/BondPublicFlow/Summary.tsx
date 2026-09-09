import React, { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import SafeAreaView from "~/components/SafeAreaView";
import { Trans } from "~/context/Locale";
import { Text } from "@ledgerhq/native-ui";
import invariant from "invariant";
import BigNumber from "bignumber.js";
import { getMainAccount, getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { isAleoAccount } from "@ledgerhq/live-common/families/aleo/utils";
import type {
  AleoAccount,
  Transaction as AleoTransaction,
} from "@ledgerhq/live-common/families/aleo/types";
import { useSelector } from "~/context/hooks";
import { accountScreenSelector } from "~/reducers/accounts";
import { useTheme } from "@react-navigation/native";
import { TrackScreen } from "~/analytics";
import TranslatedError from "~/components/TranslatedError";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import CurrencyIcon from "~/components/CurrencyIcon";
import Circle from "~/components/Circle";
import Button from "~/components/Button";
import Alert from "~/components/Alert";
import FirstLetterIcon from "~/components/FirstLetterIcon";
import { ScreenName } from "~/const";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { BondPublicFlowParamList } from "./types";
import { rgba } from "~/colors";
import DelegatingContainer from "../../tezos/DelegatingContainer";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";

type Props = BaseComposite<
  StackNavigatorProps<BondPublicFlowParamList, ScreenName.AleoBondPublicSummary>
>;

export default function Summary({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));

  invariant(
    account && isAleoAccount(account) && account.type === "Account",
    "aleo account required",
  );

  const aleoAccount = account as AleoAccount;
  const mainAccount = getMainAccount(aleoAccount, parentAccount ?? null);
  const unit = useAccountUnit(aleoAccount);
  const { validatorAddress, amount: amountStr } = route.params;
  const amountBN = new BigNumber(amountStr);

  const bridge = useAccountBridge<AleoTransaction>(aleoAccount, parentAccount);

  const { transaction, status, bridgePending, bridgeError } = useBridgeTransaction(bridge, () => {
    const t0 = bridge.createTransaction(mainAccount);
    const t1 = bridge.updateTransaction(t0, {
      mode: "bond_public",
      recipient: validatorAddress,
      amount: amountBN,
      withdrawal: mainAccount.freshAddress,
    });
    return { account: aleoAccount, parentAccount: parentAccount ?? undefined, transaction: t1 };
  });

  const hasErrors = Object.keys(status.errors ?? {}).length > 0;

  const onSign = useCallback(() => {
    if (!transaction) return;
    navigation.navigate(ScreenName.AleoBondPublicConnectDevice, {
      accountId: route.params.accountId,
      parentId: route.params.parentId,
      transaction: transaction as AleoTransaction,
      status,
    });
  }, [navigation, route.params, transaction, status]);

  const currency = getAccountCurrency(aleoAccount);
  const currencyColor = getCurrencyColor(currency);
  const spendable = aleoAccount.aleoResources?.transparentBalance ?? aleoAccount.spendableBalance;
  const truncatedValidator = `${validatorAddress.slice(0, 8)}…${validatorAddress.slice(-6)}`;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen category="BondPublicFlow" name="Summary" flow="bond" currency="aleo" />
      <View style={styles.body}>
        <DelegatingContainer
          left={
            <View style={styles.delegatingAccount}>
              <Circle size={64} bg={rgba(currencyColor, 0.2)}>
                <CurrencyIcon size={32} currency={currency} />
              </Circle>
              <View style={[styles.balanceTag, { backgroundColor: colors.lightFog }]}>
                <Text
                  fontWeight="semiBold"
                  numberOfLines={1}
                  style={styles.balanceTagText}
                  color="smoke"
                >
                  <CurrencyUnitValue showCode unit={unit} value={spendable} />
                </Text>
              </View>
            </View>
          }
          right={
            <Circle size={70} style={[styles.validatorCircle, { borderColor: colors.primary }]}>
              <FirstLetterIcon
                round
                label={validatorAddress}
                size={64}
                fontSize={32}
                style={styles.validatorLetterIcon}
              />
            </Circle>
          }
        />
        <View style={styles.summary}>
          <View style={styles.summaryLine}>
            <Text numberOfLines={1} fontWeight="semiBold" style={styles.summaryWords} color="smoke">
              <Trans i18nKey="aleo.bond.summary.bondWord" />
            </Text>
            <View style={[styles.selectable, { backgroundColor: rgba(colors.live, 0.2) }]}>
              <Text fontWeight="bold" numberOfLines={1} style={styles.selectableText} color="live">
                <CurrencyUnitValue showCode unit={unit} value={amountBN} />
              </Text>
            </View>
          </View>
          <View style={styles.summaryLine}>
            <Text numberOfLines={1} fontWeight="semiBold" style={styles.summaryWords} color="smoke">
              <Trans i18nKey="aleo.bond.summary.toWord" />
            </Text>
            <View style={[styles.selectable, { backgroundColor: rgba(colors.live, 0.2) }]}>
              <Text fontWeight="bold" numberOfLines={1} style={styles.selectableText} color="live">
                {truncatedValidator}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.alert}>
          <Alert type="primary">
            <Trans i18nKey="aleo.bond.summary.alert" />
          </Alert>
        </View>
      </View>
      <View style={styles.footer}>
        {!bridgePending && status.estimatedFees && (
          <Text variant="small" color="neutral.c70" mb={2} textAlign="center">
            <Trans i18nKey="send.summary.fees" />{" "}
            <CurrencyUnitValue unit={unit} value={status.estimatedFees} showCode />
          </Text>
        )}
        {bridgeError && (
          <Text variant="small" color="error.c50" mb={2} textAlign="center">
            <TranslatedError error={bridgeError} />
          </Text>
        )}
        {!bridgePending && hasErrors && (
          <>
            {Object.values(status.errors).map((err, i) => (
              <Text key={i} variant="small" color="error.c50" mb={2} textAlign="center">
                <TranslatedError error={err} />
              </Text>
            ))}
          </>
        )}
        <Button
          type="primary"
          title={<Trans i18nKey="common.continue" />}
          onPress={onSign}
          containerStyle={styles.button}
          disabled={bridgePending || !!bridgeError || hasErrors}
          pending={bridgePending}
          testID="summary-continue-button"
          event="AleoBondSummaryContinue"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: "column" },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: "space-around",
  },
  delegatingAccount: {
    minWidth: 80,
    alignItems: "center",
    paddingTop: 26,
  },
  balanceTag: {
    marginTop: 8,
    borderRadius: 4,
    padding: 4,
    alignItems: "center",
  },
  balanceTagText: {
    fontSize: 11,
  },
  validatorCircle: {
    borderWidth: 1,
    borderStyle: "dashed",
  },
  validatorLetterIcon: {
    borderRadius: 32,
  },
  summary: {
    alignItems: "center",
    marginVertical: 30,
  },
  summaryLine: {
    marginVertical: 10,
    flexDirection: "row",
    height: 40,
    alignItems: "center",
  },
  summaryWords: {
    marginRight: 6,
    fontSize: 18,
  },
  selectable: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 4,
    height: 40,
  },
  selectableText: {
    paddingHorizontal: 8,
    fontSize: 18,
    maxWidth: 240,
  },
  alert: {
    marginBottom: 16,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    alignItems: "center",
  },
  button: { alignSelf: "stretch" },
});
