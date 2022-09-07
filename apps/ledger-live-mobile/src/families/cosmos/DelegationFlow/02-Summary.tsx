import {
  getAccountCurrency,
  getAccountUnit,
  getMainAccount,
} from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import {
  formatCurrencyUnit,
  getCurrencyColor,
} from "@ledgerhq/live-common/currencies/index";
import { getMaxDelegationAvailable } from "@ledgerhq/live-common/families/cosmos/logic";
import { useLedgerFirstShuffledValidatorsCosmosFamily } from "@ledgerhq/live-common/families/cosmos/react";
import {
  CosmosValidatorItem,
  Transaction,
} from "@ledgerhq/live-common/families/cosmos/types";
import { LEDGER_VALIDATOR_ADDRESS } from "@ledgerhq/live-common/families/cosmos/utils";
import { AccountLike } from "@ledgerhq/types-live";
import { Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Trans } from "react-i18next";
import { Animated, SafeAreaView, StyleSheet, View } from "react-native";
import Icon from "react-native-vector-icons/dist/Feather";
import { useSelector } from "react-redux";
import { TrackScreen } from "../../../analytics";
import { rgba } from "../../../colors";
import Button from "../../../components/Button";
import Circle from "../../../components/Circle";
import CurrencyIcon from "../../../components/CurrencyIcon";
import CurrencyUnitValue from "../../../components/CurrencyUnitValue";
import Touchable from "../../../components/Touchable";
import { ScreenName } from "../../../const";
import DelegatingContainer from "../../tezos/DelegatingContainer";
import { accountScreenSelector } from "../../../reducers/accounts";
import ValidatorImage from "../shared/ValidatorImage";

type Props = {
  navigation: any;
  route: { params: RouteParams };
};

type RouteParams = {
  validator: CosmosValidatorItem;
  transaction?: Transaction;
  fromSelectAmount: boolean;
};

export default function DelegationSummary({ navigation, route }: Props) {
  const { validator } = route.params;
  const { colors } = useTheme();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));

  invariant(account, "account must be defined");

  const validators = useLedgerFirstShuffledValidatorsCosmosFamily("cosmos");
  const mainAccount = getMainAccount(account, parentAccount);
  const bridge = getAccountBridge(account, undefined);

  const chosenValidator = useMemo(() => {
    if (validator !== undefined) {
      return validator;
    }

    return validators[0];
  }, [validators, validator]);

  const {
    transaction,
    updateTransaction,
    setTransaction,
    status,
    bridgePending,
    bridgeError,
  } = useBridgeTransaction(() => {
    const tx = route.params.transaction;

    if (!tx) {
      const t = bridge.createTransaction(mainAccount);

      return {
        account,
        transaction: bridge.updateTransaction(t, {
          mode: "delegate",
          validators: [],
          /** @TODO remove this once the bridge handles it */
          recipient: mainAccount.freshAddress,
        }),
      };
    }

    return { account, transaction: tx };
  });

  invariant(transaction, "transaction must be defined");
  invariant(transaction.family === "cosmos", "transaction cosmos");

  useEffect(() => {
    if (!route.params.fromSelectAmount) {
      return;
    }

    const tmpTransaction = route.params.transaction;
    if (tmpTransaction) {
      updateTransaction(_ => tmpTransaction);
    }

    if (
      chosenValidator.validatorAddress !== transaction.validators[0].address
    ) {
      setTransaction(
        bridge.updateTransaction(transaction, {
          validators: [
            {
              address: chosenValidator.validatorAddress,
              amount: transaction.amount,
            },
          ],
        }),
      );
    }
  }, [
    route.params,
    updateTransaction,
    bridge,
    setTransaction,
    chosenValidator,
  ]);

  const [rotateAnim] = useState(() => new Animated.Value(0));
  useEffect(() => {
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
    return () => {
      rotateAnim.setValue(0);
    };
  }, [rotateAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    // $FlowFixMe
    outputRange: ["0deg", "30deg"],
  });

  const onChangeDelegator = useCallback(() => {
    rotateAnim.setValue(0);
    navigation.navigate(ScreenName.CosmosDelegationValidatorSelect, {
      ...route.params,
      transaction,
    });
  }, [rotateAnim, navigation, transaction, route.params]);

  const currency = getAccountCurrency(account);
  const color = getCurrencyColor(currency);

  const max = getMaxDelegationAvailable(mainAccount, 0);

  const onChangeAmount = () => {
    navigation.navigate(ScreenName.CosmosDelegationAmount, {
      ...route.params,
      transaction,
      validator: chosenValidator,
      min: null,
      max,
      value: transaction.amount,
      status,
      nextScreen: ScreenName.CosmosDelegationValidator,
      redelegatedBalance: null,
    });
  };

  const onContinue = useCallback(async () => {
    navigation.navigate(ScreenName.CosmosDelegationSelectDevice, {
      accountId: account.id,
      parentId: parentAccount && parentAccount.id,
      transaction,
      status,
    });
  }, [status, account, parentAccount, navigation, transaction]);

  const hasErrors = Object.keys(status.errors).length > 0;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen category="DelegationFlow" name="Summary" />

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
            <Touchable
              event="DelegationFlowSummaryChangeCircleBtn"
              onPress={onChangeDelegator}
            >
              <Circle
                size={70}
                style={[
                  styles.validatorCircle,
                  { borderColor: colors.primary },
                ]}
              >
                <Animated.View
                  style={{
                    transform: [
                      {
                        rotate,
                      },
                    ],
                  }}
                >
                  <ValidatorImage
                    isLedger={
                      chosenValidator.validatorAddress ===
                      LEDGER_VALIDATOR_ADDRESS
                    }
                    name={
                      chosenValidator?.name ?? chosenValidator?.validatorAddress
                    }
                  />
                </Animated.View>
                <ChangeDelegator />
              </Circle>
            </Touchable>
          }
        />

        <View style={styles.summary}>
          <SummaryWords
            onChangeValidator={onChangeDelegator}
            onChangeAmount={onChangeAmount}
            validator={chosenValidator}
            account={account}
            amount={transaction.amount}
          />
        </View>
      </View>
      <View style={styles.footer}>
        <Button
          event="SummaryContinue"
          type="primary"
          title={<Trans i18nKey="common.continue" />}
          containerStyle={styles.continueButton}
          onPress={onContinue}
          disabled={bridgePending || !!bridgeError || hasErrors}
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
});

function SummaryWords({
  validator,
  account,
  amount,
  onChangeValidator,
  onChangeAmount,
}: {
  validator?: CosmosValidatorItem;
  account: AccountLike;
  amount: BigNumber;
  onChangeValidator: () => void;
  onChangeAmount: () => void;
}) {
  const unit = getAccountUnit(account);
  const formattedAmount = formatCurrencyUnit(unit, amount, {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
  });
  return (
    <>
      <Line>
        <Words>
          <Trans i18nKey={`cosmos.delegation.iDelegate`} />
        </Words>
        <Touchable onPress={onChangeAmount}>
          <Selectable name={formattedAmount} />
        </Touchable>
      </Line>
      <Line>
        <Words>
          <Trans i18nKey="delegation.to" />
        </Words>
        <Touchable onPress={onChangeValidator}>
          <Selectable
            name={validator?.name ?? validator?.validatorAddress ?? "-"}
          />
        </Touchable>
      </Line>
    </>
  );
}

const AccountBalanceTag = ({ account }: { account: AccountLike }) => {
  const unit = getAccountUnit(account);
  const { colors } = useTheme();
  return (
    <View
      style={[styles.accountBalanceTag, { backgroundColor: colors.border }]}
    >
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
  style?: any;
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

const Selectable = ({ name }: { name: string; readOnly?: boolean }) => {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.validatorSelection,
        { backgroundColor: rgba(colors.primary, 0.2) },
      ]}
    >
      <Text
        fontWeight="bold"
        numberOfLines={1}
        style={styles.validatorSelectionText}
        color={colors.primary}
      >
        {name}
      </Text>

      <View
        style={[
          styles.validatorSelectionIcon,
          { backgroundColor: colors.primary },
        ]}
      >
        <Icon size={16} name="edit-2" color={colors.text} />
      </View>
    </View>
  );
};
