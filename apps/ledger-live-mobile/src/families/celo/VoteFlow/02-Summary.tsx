import {
  getAccountCurrency,
  getAccountUnit,
  getMainAccount,
} from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { formatCurrencyUnit, getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import { useValidatorGroups } from "@ledgerhq/live-common/families/celo/react";
import { CeloValidatorGroup } from "@ledgerhq/live-common/families/celo/types";
import { defaultValidatorGroupAddress } from "@ledgerhq/live-common/families/celo/logic";
import { AccountLike } from "@ledgerhq/types-live";
import { Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Trans } from "react-i18next";
import { Animated, SafeAreaView, StyleSheet, View } from "react-native";
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
import ValidatorImage from "../ValidatorImage";
import Selectable from "../components/Selectable";
import Line from "../components/Line";
import Words from "../components/Words";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { CeloVoteFlowParamList } from "./types";

type Props = StackNavigatorProps<CeloVoteFlowParamList, ScreenName.CeloVoteSummary>;

export default function VoteSummary({ navigation, route }: Props) {
  const { validator } = route.params;
  const { colors } = useTheme();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));

  invariant(account, "account must be defined");

  const validators = useValidatorGroups();
  const mainAccount = getMainAccount(account, parentAccount);
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
            mode: "vote",
            recipient: defaultValidatorGroupAddress(),
            amount: route.params.amount ?? 0,
          }),
        };
      }

      return { account, transaction: tx };
    });

  invariant(transaction, "transaction must be defined");
  invariant(transaction.family === "celo", "transaction celo");

  useEffect(() => {
    setTransaction(
      bridge.updateTransaction(transaction, {
        amount: new BigNumber(route.params.amount ?? new BigNumber(0)),
        recipient: chosenValidator.address,
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params.amount, updateTransaction, bridge, setTransaction, chosenValidator]);

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
    navigation.navigate(ScreenName.CeloVoteValidatorSelect, {
      ...route.params,
      transaction,
    });
  }, [rotateAnim, navigation, transaction, route.params]);

  const currency = getAccountCurrency(account);
  const color = getCurrencyColor(currency);

  const onChangeAmount = () => {
    navigation.navigate(ScreenName.CeloVoteAmount, {
      ...route.params,
      transaction,
    });
  };

  const onContinue = useCallback(async () => {
    navigation.navigate(ScreenName.CeloVoteSelectDevice, {
      accountId: account.id,
      parentId: parentAccount?.id,
      transaction,
      status,
    });
  }, [navigation, account.id, parentAccount?.id, transaction, status]);

  const hasErrors = Object.keys(status.errors).length > 0;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen category="VoteFlow" name="Summary" flow="stake" action="vote" currency="celo" />

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
            <Touchable event="VoteFlowSummaryChangeCircleBtn" onPress={onChangeDelegator}>
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
                  <ValidatorImage
                    isLedger={chosenValidator.address === defaultValidatorGroupAddress()}
                    name={chosenValidator?.name ?? chosenValidator?.address}
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
  validator?: CeloValidatorGroup;
  account: AccountLike;
  amount: BigNumber;
  onChangeValidator: () => void;
  onChangeAmount: () => void;
}) {
  const unit = getAccountUnit(account);
  const formattedAmount = formatCurrencyUnit(unit, new BigNumber(amount), {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
  });
  return (
    <>
      <Line>
        <Words>
          <Trans i18nKey={`celo.vote.iVote`} />
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
          <Selectable name={validator?.name ?? validator?.address ?? "-"} />
        </Touchable>
      </Line>
    </>
  );
}

const AccountBalanceTag = ({ account }: { account: AccountLike }) => {
  const unit = getAccountUnit(account);
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

const ChangeDelegator = () => {
  const { colors } = useTheme();
  return (
    <Circle style={styles.changeDelegator} bg={colors.primary} size={26}>
      <Icon size={13} name="edit-2" />
    </Circle>
  );
};
