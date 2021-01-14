/* @flow */
import React, { useCallback, useEffect, useState } from "react";
import { View, StyleSheet, Animated } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import invariant from "invariant";
import Icon from "react-native-vector-icons/dist/Feather";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import {
  getAccountCurrency,
  getAccountName,
  getAccountUnit,
  shortAddressPreview,
} from "@ledgerhq/live-common/lib/account";
import { getCurrencyColor } from "@ledgerhq/live-common/lib/currencies";
import useBridgeTransaction from "@ledgerhq/live-common/lib/bridge/useBridgeTransaction";
import {
  useDelegation,
  useBaker,
  useBakers,
  useRandomBaker,
} from "@ledgerhq/live-common/lib/families/tezos/bakers";
import whitelist from "@ledgerhq/live-common/lib/families/tezos/bakers.whitelist-default";
import type { AccountLike } from "@ledgerhq/live-common/lib/types";
import { useTheme } from "@react-navigation/native";
import { accountScreenSelector } from "../../../reducers/accounts";
import { rgba } from "../../../colors";
import { ScreenName } from "../../../const";
import { TrackScreen } from "../../../analytics";
import { useTransactionChangeFromNavigation } from "../../../logic/screenTransactionHooks";
import Button from "../../../components/Button";
import LText from "../../../components/LText";
import Circle from "../../../components/Circle";
import CurrencyIcon from "../../../components/CurrencyIcon";
import CurrencyUnitValue from "../../../components/CurrencyUnitValue";
import Touchable from "../../../components/Touchable";
import VerifyAddressDisclaimer from "../../../components/VerifyAddressDisclaimer";
import DelegatingContainer from "../DelegatingContainer";
import BakerImage from "../BakerImage";

const forceInset = { bottom: "always" };

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

type RouteParams = {
  mode?: "delegate" | "undelegate",
  accountId: string,
  parentId?: string,
};

const AccountBalanceTag = ({ account }: { account: AccountLike }) => {
  const unit = getAccountUnit(account);
  const { colors } = useTheme();
  return (
    <View
      style={[styles.accountBalanceTag, { backgroundColor: colors.lightFog }]}
    >
      <LText
        semiBold
        numberOfLines={1}
        style={styles.accountBalanceTagText}
        color="smoke"
      >
        <CurrencyUnitValue showCode unit={unit} value={account.balance} />
      </LText>
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

const Line = ({ children }: { children: React$Node }) => (
  <View style={styles.summaryLine}>{children}</View>
);

const Words = ({
  children,
  highlighted,
  style,
}: {
  children: React$Node,
  highlighted?: boolean,
  style?: any,
}) => (
  <LText
    numberOfLines={1}
    semiBold={!highlighted}
    bold={highlighted}
    style={[styles.summaryWords, style]}
    color={highlighted ? "live" : "smoke"}
  >
    {children}
  </LText>
);

const BakerSelection = ({
  name,
  readOnly,
}: {
  name: string,
  readOnly?: boolean,
}) => {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.bakerSelection,
        { backgroundColor: rgba(colors.live, 0.2) },
      ]}
    >
      <LText
        bold
        numberOfLines={1}
        style={styles.bakerSelectionText}
        color="live"
      >
        {name}
      </LText>
      {readOnly ? null : (
        <View
          style={[styles.bakerSelectionIcon, { backgroundColor: colors.live }]}
        >
          <Icon size={16} name="edit-2" color={colors.white} />
        </View>
      )}
    </View>
  );
};

export default function DelegationSummary({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  const bakers = useBakers(whitelist);
  const randomBaker = useRandomBaker(bakers);

  const {
    transaction,
    setTransaction,
    status,
    bridgePending,
    bridgeError,
  } = useBridgeTransaction(() => ({
    account,
    parentAccount,
  }));

  invariant(transaction, "transaction must be defined");
  invariant(transaction.family === "tezos", "transaction tezos");

  // make sure tx is in sync
  useEffect(() => {
    if (!transaction || !account) return;
    invariant(transaction.family === "tezos", "tezos tx");

    // make sure the mode is in sync (an account changes can reset it)
    const patch: Object = {
      mode: route.params?.mode ?? "delegate",
    };

    // make sure that in delegate mode, a transaction recipient is set (random pick)
    if (patch.mode === "delegate" && !transaction.recipient && randomBaker) {
      patch.recipient = randomBaker.address;
    }

    // when changes, we set again
    if (patch.mode !== transaction.mode || "recipient" in patch) {
      setTransaction(
        getAccountBridge(account, parentAccount).updateTransaction(
          transaction,
          patch,
        ),
      );
    }
  }, [
    account,
    randomBaker,
    navigation,
    parentAccount,
    setTransaction,
    transaction,
    route.params,
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
    outputRange: ["0deg", "30deg"],
  });

  const onChangeDelegator = useCallback(() => {
    rotateAnim.setValue(0);
    navigation.navigate(ScreenName.DelegationSelectValidator, {
      ...route.params,
      transaction,
    });
  }, [rotateAnim, navigation, transaction, route.params]);

  const delegation = useDelegation(account);
  const addr =
    transaction.mode === "undelegate"
      ? (delegation && delegation.address) || ""
      : transaction.recipient;
  const baker = useBaker(addr);
  const bakerName = baker ? baker.name : shortAddressPreview(addr);
  const currency = getAccountCurrency(account);
  const color = getCurrencyColor(currency);
  const accountName = getAccountName(account);

  // handle any edit screen changes
  useTransactionChangeFromNavigation(setTransaction);

  const onContinue = useCallback(async () => {
    navigation.navigate(ScreenName.DelegationSelectDevice, {
      accountId: account.id,
      parentId: parentAccount && parentAccount.id,
      transaction,
      status,
    });
  }, [status, account, parentAccount, navigation, transaction]);

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }]}
      forceInset={forceInset}
    >
      <TrackScreen category="DelegationFlow" name="Summary" />

      <View style={styles.body}>
        <DelegatingContainer
          undelegation={transaction.mode === "undelegate"}
          left={
            <View style={styles.delegatingAccount}>
              <Circle size={64} bg={rgba(color, 0.2)}>
                <CurrencyIcon size={32} currency={currency} />
              </Circle>
              <AccountBalanceTag account={account} />
            </View>
          }
          right={
            transaction.mode === "delegate" ? (
              <Touchable
                event="DelegationFlowSummaryChangeCircleBtn"
                onPress={onChangeDelegator}
              >
                <Circle
                  size={70}
                  style={[styles.bakerCircle, { borderColor: colors.grey }]}
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
                    <BakerImage baker={baker} />
                  </Animated.View>
                  <ChangeDelegator />
                </Circle>
              </Touchable>
            ) : (
              <BakerImage baker={baker} />
            )
          }
        />

        <View style={styles.summary}>
          <Line>
            <Words>
              {transaction.mode === "delegate" ? (
                <Trans i18nKey="delegation.iDelegateMy" />
              ) : (
                <Trans i18nKey="delegation.undelegateMy" />
              )}
            </Words>
            <Words highlighted style={styles.accountName}>
              {accountName}
            </Words>
          </Line>

          {transaction.mode === "delegate" ? (
            <Line>
              <Words>
                <Trans i18nKey="delegation.to" />
              </Words>
              <Touchable
                event="DelegationFlowSummaryChangeBtn"
                onPress={onChangeDelegator}
              >
                <BakerSelection name={bakerName} />
              </Touchable>
            </Line>
          ) : (
            <Line>
              <Words>
                <Trans i18nKey="delegation.from" />
              </Words>
              <BakerSelection readOnly name={bakerName} />
            </Line>
          )}

          {baker && transaction.mode === "delegate" ? (
            baker.capacityStatus === "full" ? null : (
              /*
              <Line>
                <IconInfo size={16} color={colors.orange} />
                <Words style={{ marginLeft: 8, color: colors.orange }}>
                  <Trans i18nKey="delegation.overdelegated" />
                </Words>
              </Line>
              */ <Line>
                <Words>
                  <Trans i18nKey="delegation.forAnEstYield" />
                </Words>
                <Words highlighted>
                  <Trans
                    i18nKey="delegation.yieldPerYear"
                    values={{
                      yield: baker.nominalYield,
                    }}
                  />
                </Words>
              </Line>
            )
          ) : null}
        </View>
        {transaction.mode === "undelegate" ? (
          <VerifyAddressDisclaimer
            text={<Trans i18nKey="delegation.warnUndelegation" />}
          />
        ) : (
          <VerifyAddressDisclaimer
            text={<Trans i18nKey="delegation.warnDelegation" />}
          />
        )}
      </View>
      <View style={styles.footer}>
        <Button
          event="SummaryContinue"
          type="primary"
          title={<Trans i18nKey="common.continue" />}
          containerStyle={styles.continueButton}
          onPress={onContinue}
          disabled={bridgePending || !!bridgeError}
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
  bakerCircle: {
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
  bakerSelection: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 4,
    height: 40,
  },
  bakerSelectionText: {
    paddingHorizontal: 8,
    fontSize: 18,
    maxWidth: 240,
  },
  bakerSelectionIcon: {
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
