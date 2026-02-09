import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { formatCurrencyUnit, getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import { Icons, Text } from "@ledgerhq/native-ui";
import { AccountLike } from "@ledgerhq/types-live";
import { CompositeScreenProps, useTheme } from "@react-navigation/native";
import invariant from "invariant";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import React, { ReactNode, useCallback, useEffect, useState } from "react";
import { Trans } from "~/context/Locale";
import { Animated, StyleProp, StyleSheet, TextStyle, View } from "react-native";
import Config from "react-native-config";
import { SafeAreaView } from "react-native-safe-area-context";
import { TrackScreen } from "~/analytics";
import Button from "~/components/Button";
import Circle from "~/components/Circle";
import CurrencyIcon from "~/components/CurrencyIcon";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import Touchable from "~/components/Touchable";
import TranslatedError from "~/components/TranslatedError";
import { ScreenName } from "~/const";
import { useSelector } from "~/context/store";
import { accountScreenSelector } from "~/reducers/accounts";
import { rgba } from "../../../colors";
import DelegatingContainer from "../../tezos/DelegatingContainer";
import { MinaStakingFlowParamList } from "./types";
import { ValidatorImage } from "./ValidatorRow";

type Props = CompositeScreenProps<
  StackNavigatorProps<MinaStakingFlowParamList, ScreenName.MinaStakingSummary>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

function StakingSummary({ navigation, route }: Props) {
  const { validator } = route.params;
  const { colors } = useTheme();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));

  invariant(validator, "validator must be defined");
  invariant(account, "account must be defined");
  invariant(account.type === "Account", "account type must be Account");

  const { transaction, setTransaction, status, bridgePending, bridgeError } = useBridgeTransaction(
    () => {
      const bridge = getAccountBridge(account);
      const tx = bridge.createTransaction(account);
      return {
        account,
        parentAccount,
        transaction: bridge.updateTransaction(tx, {
          txType: "stake",
          recipient: validator.address,
        }),
      };
    },
  );

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (!transaction) return;
    const bridge = getAccountBridge(account);
    setTransaction(
      bridge.updateTransaction(transaction, {
        recipient: validator.address,
      }),
    );
  }, [validator, account, setTransaction]);

  invariant(transaction, "transaction must be defined");
  invariant(transaction.family === "mina", "transaction mina");

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

  const onChangeDelegator = useCallback(() => {
    rotateAnim.setValue(0);
    navigation.navigate(ScreenName.MinaStakingValidator, route.params);
  }, [rotateAnim, navigation, route.params]);

  const currency = getAccountCurrency(account);
  const color = getCurrencyColor(currency);

  const onContinue = useCallback(async () => {
    if (!transaction || transaction.family !== "mina") return;
    navigation.navigate(ScreenName.MinaStakingSelectDevice, {
      ...route.params,
      accountId: account.id,
      parentId: parentAccount?.id,
      transaction,
      status,
    });
  }, [route.params, navigation, account.id, parentAccount?.id, transaction, status]);

  const hasErrors = Object.keys(status.errors).length > 0;
  const error = Object.values(status.errors)[0];

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="DelegationFlow"
        name="Summary"
        flow="stake"
        action="delegation"
        currency="mina"
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
            <Touchable event="DelegationFlowSummaryChangeCircleBtn" onPress={onChangeDelegator}>
              <Circle size={70} style={[styles.validatorCircle, { borderColor: colors.primary }]}>
                <Animated.View
                  style={{
                    transform: [{ rotate }],
                  }}
                >
                  <ValidatorImage name={validator?.name ?? validator?.address} size={64} />
                </Animated.View>
                <ChangeDelegator />
              </Circle>
            </Touchable>
          }
        />

        <View style={styles.summary}>
          <SummaryWords
            onChangeValidator={onChangeDelegator}
            validatorName={validator?.name ?? validator?.address}
            account={account}
          />
        </View>
      </View>
      <View style={styles.footer}>
        <TranslatedError error={error} />
        <Button
          event="SummaryContinue"
          type="primary"
          title={<Trans i18nKey="common.continue" />}
          containerStyle={styles.continueButton}
          onPress={onContinue}
          disabled={bridgePending || !!bridgeError || hasErrors}
          pending={bridgePending}
          testID="mina-summary-continue-button"
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
  changeDelegator: {
    position: "absolute",
    right: -4,
    top: -4,
  },
  delegatingAccount: {
    paddingTop: 26,
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
});

function SummaryWords({
  validatorName,
  account,
  onChangeValidator,
}: {
  validatorName: string;
  account: AccountLike;
  onChangeValidator: () => void;
}) {
  const unit = useAccountUnit(account);
  const formattedAmount = formatCurrencyUnit(unit, account.spendableBalance, {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
  });
  return (
    <>
      <Line>
        <Words>
          <Trans i18nKey="mina.delegation.iDelegate" />
        </Words>
        <Selectable readOnly name={formattedAmount} />
      </Line>
      <Line>
        <Words>
          <Trans i18nKey="delegation.to" />
        </Words>
        <Touchable onPress={onChangeValidator}>
          <Selectable name={validatorName} testID="mina-delegation-summary-validator" />
        </Touchable>
      </Line>
    </>
  );
}

const AccountBalanceTag = ({ account }: { account: AccountLike }) => {
  const unit = useAccountUnit(account);
  const { colors } = useTheme();
  return (
    <View style={[styles.accountBalanceTag, { backgroundColor: colors.card }]}>
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

const ChangeDelegator = () => {
  const { colors } = useTheme();
  return (
    <Circle style={styles.changeDelegator} bg={colors.primary} size={26}>
      <Icons.PenEdit size="XS" color={colors.white} />
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

const Selectable = ({
  name,
  readOnly,
  testID,
}: {
  name: string;
  readOnly?: boolean;
  testID?: string;
}) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.validatorSelection, { backgroundColor: rgba(colors.primary, 0.2) }]}>
      <Text
        fontWeight="bold"
        numberOfLines={1}
        style={styles.validatorSelectionText}
        color="live"
        testID={testID}
      >
        {name}
      </Text>
      {readOnly ? null : (
        <View style={[styles.validatorSelectionIcon, { backgroundColor: colors.primary }]}>
          <Icons.PenEdit size="XS" color={colors.background} />
        </View>
      )}
    </View>
  );
};

export default StakingSummary;
