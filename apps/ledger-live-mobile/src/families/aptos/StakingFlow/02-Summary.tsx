import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { formatCurrencyUnit, getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import { useAptosValidators } from "@ledgerhq/live-common/families/aptos/react";
import { AptosAccount, AptosValidator } from "@ledgerhq/live-common/families/aptos/types";
import { AccountLike } from "@ledgerhq/types-live";
import { Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import React, { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { Trans } from "react-i18next";
import { Animated, SafeAreaView, StyleSheet, View, TextStyle, StyleProp } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useSelector } from "react-redux";
import { TrackScreen } from "~/analytics";
import { rgba } from "../../../colors";
import Button from "~/components/Button";
import Circle from "~/components/Circle";
import CurrencyIcon from "~/components/CurrencyIcon";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import Touchable from "~/components/Touchable";
import { ScreenName } from "~/const";
import DelegatingContainer from "../../tezos/DelegatingContainer";
import { accountScreenSelector } from "~/reducers/accounts";
import ValidatorImage from "../shared/ValidatorImage";
import LText from "~/components/LText";
import TranslatedError from "~/components/TranslatedError";
import { getFirstStatusError, hasStatusError } from "../../helpers";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { AptosStakingFlowParamList } from "./types";
import { useAccountUnit } from "~/hooks/useAccountUnit";
import Config from "react-native-config";
import { getMaxSendBalance } from "@ledgerhq/live-common/families/aptos/logic";

type Props = BaseComposite<
  StackNavigatorProps<AptosStakingFlowParamList, ScreenName.AptosStakingValidator>
>;

export default function StakingSummary({ navigation, route }: Props) {
  const { validator } = route.params;
  const { colors } = useTheme();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));

  invariant(account, "account must be defined");

  const mainAccount = getMainAccount(account, parentAccount);
  const validators = useAptosValidators(mainAccount.currency);
  const bridge = getAccountBridge(account, undefined);

  const chosenValidator = useMemo(() => {
    if (validator !== undefined) {
      return validator;
    }

    return validators[0];
  }, [validators, validator]);

  const { transaction, updateTransaction, setTransaction, status, bridgePending, bridgeError } =
    useBridgeTransaction(() => {
      const tx = route.params.transaction;

      if (!tx) {
        const t = bridge.createTransaction(mainAccount);

        return {
          account,
          transaction: bridge.updateTransaction(t, {
            mode: "stake",
            recipient: chosenValidator.address,
          }),
        };
      }

      return { account, transaction: tx };
    });

  invariant(transaction, "transaction must be defined");
  invariant(transaction.family === "aptos", "transaction aptos");

  useEffect(() => {
    const tmpTransaction = route.params.transaction;
    if (tmpTransaction) {
      updateTransaction(_ => tmpTransaction);
    }

    if (chosenValidator.address !== transaction.recipient) {
      setTransaction(
        bridge.updateTransaction(transaction, {
          recipient: chosenValidator.address,
        }),
      );
    }
    // NOTE: Dependencies should be exhaustive in the vast majority of cases.
    //       In this case we can't add `transaction` as a dependency inside this
    //       useEffect because it is updating the transaction. This will create an
    //       endless loop, freezing the app.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    route.params,
    bridge,
    setTransaction,
    chosenValidator,
    updateTransaction,
    route.params.transaction,
  ]);

  const [rotateAnim] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!Config.DETOX) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: -1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.delay(1000),
        ]),
      ).start();
    }
    return () => {
      rotateAnim.setValue(0);
    };
  }, [rotateAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "30deg"],
  });

  const onChangeValidator = useCallback(() => {
    rotateAnim.setValue(0);
    navigation.navigate(ScreenName.AptosStakingValidatorSelect, {
      ...route.params,
      transaction,
    });
  }, [rotateAnim, navigation, transaction, route.params]);

  const currency = getAccountCurrency(account);
  const color = getCurrencyColor(currency);

  const onChangeAmount = () => {
    navigation.navigate(ScreenName.AptosStakingAmount, {
      ...route.params,
      transaction,
      validator: chosenValidator,
      max: getMaxSendBalance(account as AptosAccount, transaction, transaction.fees),
      value: transaction.amount,
      nextScreen: ScreenName.AptosStakingValidator,
    });
  };

  const onContinue = useCallback(async () => {
    navigation.navigate(ScreenName.AptosStakingSelectDevice, {
      source: route.params.source,
      accountId: account.id,
      parentId: parentAccount?.id,
      transaction,
      status,
    });
  }, [status, account, parentAccount?.id, navigation, transaction, route.params.source]);

  const error =
    transaction.amount.eq(0) || bridgePending ? null : getFirstStatusError(status, "errors");
  const warning = getFirstStatusError(status, "warnings");
  const hasErrors = hasStatusError(status);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="DelegationFlow"
        name={route.params.skipStartedStep ? "Step Starter" : "Summary"}
        screen="Summary"
        flow="stake"
        action="staking"
        currency="aptos"
      />

      <View style={styles.body}>
        <DelegatingContainer
          left={
            <View style={styles.delegatingAccount}>
              <Circle size={64} bg={rgba(color, 0.2)}>
                <CurrencyIcon size={32} currency={currency} />
              </Circle>
              <AccountBalanceTag account={account} />
            </View>
          }
          right={
            <Touchable event="StakingFlowSummaryChangeCircleBtn" onPress={onChangeValidator}>
              <Circle size={70} style={[styles.validatorCircle, { borderColor: colors.primary }]}>
                <Animated.View
                  style={{
                    transform: [
                      {
                        rotate,
                      },
                    ],
                  }}
                >
                  <ValidatorImage isLedger={false} name={chosenValidator?.address} />
                </Animated.View>
                <ChangeValidator />
              </Circle>
            </Touchable>
          }
        />

        <View style={styles.summary}>
          <SummaryWords
            onChangeValidator={onChangeValidator}
            onChangeAmount={onChangeAmount}
            validator={chosenValidator}
            account={account}
            amount={transaction.amount}
          />
        </View>
      </View>
      <View style={styles.footer}>
        <LText
          style={[styles.fieldStatus]}
          color={error ? "alert" : warning ? "orange" : "darkBlue"}
          numberOfLines={2}
        >
          <TranslatedError error={error || warning} />
        </LText>
        <Button
          event="SummaryContinue"
          type="primary"
          title={<Trans i18nKey="common.continue" />}
          containerStyle={styles.continueButton}
          onPress={onContinue}
          disabled={bridgePending || !!bridgeError || hasErrors}
          pending={bridgePending}
          testID="aptos-summary-continue-button"
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
    justifyContent: "space-around",
  },
  validatorCircle: {
    borderWidth: 1,
    borderStyle: "dashed",
  },
  changeValidator: {
    position: "absolute",
    right: -4,
    top: -4,
  },
  delegatingAccount: {
    paddingTop: 26,
    alignItems: "center",
  },
  accountBalanceTag: {
    marginTop: 8,
    borderRadius: 4,
    padding: 4,
    alignItems: "center",
  },
  accountBalanceTagText: {
    fontSize: 11,
  },
  accountName: {
    maxWidth: 180,
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
  validatorSelection: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 4,
    height: 40,
  },
  validatorSelectionText: {
    paddingHorizontal: 8,
    fontSize: 18,
    maxWidth: 240,
  },
  validatorSelectionIcon: {
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 40,
  },
  footer: {
    flexDirection: "column",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  continueButton: {
    alignSelf: "stretch",
    marginTop: 12,
  },
  fieldStatus: {
    fontSize: 14,
    textAlign: "center",
  },
});

function SummaryWords({
  validator,
  account,
  amount,
  onChangeValidator,
  onChangeAmount,
}: Readonly<{
  validator?: AptosValidator;
  account: AccountLike;
  amount: BigNumber;
  onChangeValidator: () => void;
  onChangeAmount: () => void;
}>) {
  const unit = useAccountUnit(account);
  const formattedAmount = formatCurrencyUnit(unit, amount, {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
  });
  return (
    <>
      <Line>
        <Words>
          <Trans i18nKey="aptos.staking.iStake" />
        </Words>
        <Touchable onPress={onChangeAmount}>
          <Selectable name={formattedAmount} testID="aptos-delegation-summary-amount" />
        </Touchable>
      </Line>
      <Line>
        <Words>
          <Trans i18nKey="delegation.to" />
        </Words>
        <Touchable onPress={onChangeValidator}>
          <Selectable
            name={validator?.address ?? "-"}
            testID="aptos-delegation-summary-validator"
          />
        </Touchable>
      </Line>
    </>
  );
}

const AccountBalanceTag = ({ account }: { account: AccountLike }) => {
  const unit = useAccountUnit(account);
  const { colors } = useTheme();
  return (
    <View style={[styles.accountBalanceTag, { backgroundColor: colors.border }]}>
      <Text
        fontWeight="semiBold"
        numberOfLines={1}
        style={styles.accountBalanceTagText}
        color="smoke"
      >
        <CurrencyUnitValue showCode unit={unit} value={account.balance} />
      </Text>
    </View>
  );
};

const ChangeValidator = () => {
  const { colors } = useTheme();
  return (
    <Circle style={styles.changeValidator} bg={colors.primary} size={26}>
      <Icon size={13} name="edit-2" />
    </Circle>
  );
};

const Line = ({ children }: { children: ReactNode }) => (
  <View style={styles.summaryLine}>{children}</View>
);

const Words = ({
  children,
  highlighted,
  style,
}: {
  children: ReactNode;
  highlighted?: boolean;
  style?: StyleProp<TextStyle>;
}) => (
  <Text
    numberOfLines={1}
    fontWeight={highlighted ? "bold" : "semiBold"}
    style={[styles.summaryWords, style]}
    color={highlighted ? "live" : "smoke"}
  >
    {children}
  </Text>
);

const Selectable = ({ name, testID }: { name: string; testID: string }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.validatorSelection, { backgroundColor: rgba(colors.primary, 0.2) }]}>
      <Text
        fontWeight="bold"
        numberOfLines={1}
        style={styles.validatorSelectionText}
        color={colors.primary}
        testID={testID}
      >
        {name}
      </Text>

      <View style={[styles.validatorSelectionIcon, { backgroundColor: colors.primary }]}>
        <Icon size={16} name="edit-2" color={colors.text} />
      </View>
    </View>
  );
};
