import React, { ReactNode, useCallback, useEffect, useState } from "react";
import Config from "react-native-config";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { formatCurrencyUnit, getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/impl";
import {
  getDefaultValidator,
  isStakingTransaction,
} from "@ledgerhq/live-common/families/hedera/utils";
import { useHederaValidators } from "@ledgerhq/live-common/families/hedera/react";
import { HEDERA_TRANSACTION_MODES } from "@ledgerhq/live-common/families/hedera/constants";
import type { HederaValidator, Transaction } from "@ledgerhq/live-common/families/hedera/types";
import type { AccountBridge, AccountLike } from "@ledgerhq/types-live";
import { Text, Icons } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import invariant from "invariant";
import { Trans, useTranslation } from "react-i18next";
import { Animated, StyleSheet, View, TextStyle, StyleProp } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TrackScreen } from "~/analytics";
import Button from "~/components/Button";
import Circle from "~/components/Circle";
import CurrencyIcon from "~/components/CurrencyIcon";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import Touchable from "~/components/Touchable";
import { ScreenName } from "~/const";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import ValidatorIcon from "~/families/hedera/shared/ValidatorIcon";
import Alert from "~/components/Alert";
import { urls } from "~/utils/urls";
import type { HederaDelegationFlowParamList } from "./types";
import TranslatedError from "../../../components/TranslatedError";
import { rgba } from "../../../colors";
import DelegatingContainer from "../../tezos/DelegatingContainer";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";

type Props = StackNavigatorProps<HederaDelegationFlowParamList, ScreenName.HederaDelegationSummary>;

export default function DelegationSummary({ navigation, route }: Readonly<Props>) {
  const { colors } = useTheme();
  const { account, parentAccount } = useAccountScreen(route);

  invariant(account, "account must be defined");
  invariant(account.type === "Account", "account type must be Account");

  const bridge: AccountBridge<Transaction> = getAccountBridge(account);
  const validators = useHederaValidators(account.currency);
  const defaultValidator = getDefaultValidator(validators);

  const { transaction, updateTransaction, status, bridgePending, bridgeError } =
    useBridgeTransaction(() => {
      const t = bridge.createTransaction(account);

      const transaction = bridge.updateTransaction(t, {
        mode: HEDERA_TRANSACTION_MODES.Delegate,
        properties: {
          stakingNodeId: defaultValidator?.nodeId ?? null,
        },
      });

      return {
        account,
        parentAccount: undefined,
        transaction,
      };
    });

  invariant(transaction, "transaction must be defined");
  invariant(isStakingTransaction(transaction), "hedera: staking tx expected");

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
  const selectedValidatorNodeId = transaction.properties?.stakingNodeId ?? null;
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
        mode: HEDERA_TRANSACTION_MODES.Delegate,
        properties: {
          stakingNodeId: validator?.nodeId ?? null,
        },
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
        action={HEDERA_TRANSACTION_MODES.Delegate}
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
                  <ValidatorIcon validator={selectedValidator} />
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
        {selectedValidator && (
          <Text color="alert" fontWeight="semiBold" textAlign="center" mb={6}>
            <TranslatedError error={error} />
          </Text>
        )}
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
}: Readonly<{
  validator?: HederaValidator;
  account: AccountLike;
  onChangeValidator: () => void;
}>) {
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
                : ""
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
          <Icons.PenEdit size="XS" color={colors.white} />
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
