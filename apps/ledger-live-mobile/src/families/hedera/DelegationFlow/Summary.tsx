import Config from "react-native-config";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { formatCurrencyUnit, getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/impl";
import { getDefaultValidator } from "@ledgerhq/live-common/families/hedera/logic";
import { useHederaValidators } from "@ledgerhq/live-common/families/hedera/react";
import { HederaValidator, Transaction } from "@ledgerhq/live-common/families/hedera/types";
import { AccountBridge, AccountLike } from "@ledgerhq/types-live";
import { Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import invariant from "invariant";
import React, { ReactNode, useCallback, useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Animated, StyleSheet, View, TextStyle, StyleProp } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Feather";
import { useSelector } from "react-redux";
import { TrackScreen } from "~/analytics";
import Button from "~/components/Button";
import Circle from "~/components/Circle";
import CurrencyIcon from "~/components/CurrencyIcon";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import Touchable from "~/components/Touchable";
import { ScreenName } from "~/const";
import { useAccountUnit } from "~/hooks/useAccountUnit";
import { accountScreenSelector } from "~/reducers/accounts";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import ValidatorIcon from "~/families/hedera/shared/ValidatorIcon";
import Alert from "~/components/Alert";
import { urls } from "~/utils/urls";
import type { HederaDelegationFlowParamList } from "./types";
import TranslatedError from "../../../components/TranslatedError";
import { rgba } from "../../../colors";
import DelegatingContainer from "../../tezos/DelegatingContainer";

type Props = StackNavigatorProps<HederaDelegationFlowParamList, ScreenName.HederaDelegationSummary>;

export default function DelegationSummary({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));

  invariant(account, "account must be defined");
  invariant(account.type === "Account", "account type must be Account");

  const bridge: AccountBridge<Transaction> = getAccountBridge(account);
  const validators = useHederaValidators(account.currency);
  const defaultValidator = getDefaultValidator(validators);

  const { transaction, updateTransaction, status, bridgePending, bridgeError } =
    useBridgeTransaction(() => {
      const transaction = bridge.createTransaction(account);

      return {
        account,
        parentAccount: undefined,
        transaction,
      };
    });

  invariant(transaction, "transaction must be defined");
  invariant(transaction.family === "hedera", "transaction hedera");

  const [rotateAnim] = useState(() => new Animated.Value(0));

  const onChangeDelegator = useCallback(() => {
    rotateAnim.setValue(0);
    navigation.navigate(ScreenName.HederaDelegationSelectValidator, route.params);
  }, [rotateAnim, navigation, route.params]);

  const onContinue = useCallback(async () => {
    navigation.navigate(ScreenName.HederaDelegationSelectDevice, {
      ...route.params,
      accountId: account.id,
      parentId: parentAccount?.id,
      transaction,
      status,
    });
  }, [route.params, navigation, account.id, parentAccount?.id, transaction, status]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "30deg"],
  });
  const currency = getAccountCurrency(account);
  const color = getCurrencyColor(currency);
  const selectedValidatorNodeId = transaction.properties?.stakedNodeId ?? null;
  const selectedValidator =
    validators.find(v => v.nodeId === selectedValidatorNodeId) ?? defaultValidator ?? undefined;
  const hasErrors = Object.keys(status.errors).length > 0;
  const error = Object.values(status.errors)[0];

  // set default validator and handle updates when route params change
  useEffect(() => {
    const { validator = defaultValidator } = route.params;

    updateTransaction(prev => {
      return {
        ...prev,
        properties: {
          name: "staking",
          mode: "delegate",
          stakedNodeId: validator?.nodeId,
        } as const,
      };
    });
  }, [updateTransaction, defaultValidator, route.params]);

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

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="DelegationFlow"
        name="Summary"
        flow="stake"
        action="delegation"
        currency="hedera"
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
                  <ValidatorIcon color={color} validatorName={selectedValidator?.name} />
                </Animated.View>
                <ChangeDelegator />
              </Circle>
            </Touchable>
          }
        />
        <View style={styles.summary}>
          <SummaryWords
            onChangeValidator={onChangeDelegator}
            validator={selectedValidator}
            account={account}
          />
        </View>
        <View style={styles.alert}>
          <Alert
            type="primary"
            learnMoreKey="hedera.delegation.steps.summary.learnMore"
            learnMoreUrl={urls.hedera.staking}
          >
            <Trans i18nKey="hedera.delegation.steps.summary.alert" />
          </Alert>
        </View>
      </View>
      <View style={styles.footer}>
        <Text color="alert" fontWeight="semiBold" textAlign="center" mb={6}>
          <TranslatedError error={error} />
        </Text>
        <Button
          event="SummaryContinue"
          type="primary"
          title={<Trans i18nKey="common.continue" />}
          containerStyle={styles.continueButton}
          onPress={onContinue}
          disabled={bridgePending || !!bridgeError || hasErrors}
          pending={bridgePending}
          testID="hedera-summary-continue-button"
        />
      </View>
    </SafeAreaView>
  );
}

function SummaryWords({
  validator,
  account,
  onChangeValidator,
}: {
  validator?: HederaValidator;
  account: AccountLike;
  onChangeValidator: () => void;
}) {
  const { t } = useTranslation();
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
          <Trans i18nKey="hedera.delegation.steps.summary.delegate" />
        </Words>
        <Selectable readOnly name={formattedAmount} />
      </Line>
      <Line>
        <Words>
          <Trans i18nKey="hedera.delegation.steps.summary.to" />
        </Words>
        <Touchable onPress={onChangeValidator}>
          <Selectable
            name={
              validator
                ? t("hedera.delegation.nodeName", { index: validator.nodeId, name: validator.name })
                : "-"
            }
            testID="hedera-delegation-summary-validator"
          />
        </Touchable>
      </Line>
    </>
  );
}

const AccountBalanceTag = ({ account, hidden }: { account: AccountLike; hidden?: boolean }) => {
  const unit = useAccountUnit(account);
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.accountBalanceTag,
        { backgroundColor: colors.lightFog },
        hidden && { opacity: 0 },
      ]}
    >
      <Text
        fontWeight="semiBold"
        numberOfLines={1}
        style={styles.accountBalanceTagText}
        color="smoke"
      >
        <CurrencyUnitValue showCode unit={unit} value={account.spendableBalance} />
      </Text>
    </View>
  );
};

const ChangeDelegator = () => {
  const { colors } = useTheme();
  return (
    <Circle style={styles.changeDelegator} bg={colors.live} size={26}>
      <Icon size={13} name="edit-2" color={colors.white} />
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
    <View style={[styles.validatorSelection, { backgroundColor: rgba(colors.live, 0.2) }]}>
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
        <View style={[styles.validatorSelectionIcon, { backgroundColor: colors.live }]}>
          <Icon size={16} name="edit-2" color={colors.white} />
        </View>
      )}
    </View>
  );
};

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
    minWidth: 80,
    alignItems: "center",
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
  alert: {
    marginBottom: 16,
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
