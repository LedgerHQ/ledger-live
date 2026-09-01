import { useTheme } from "@react-navigation/native";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import React, { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { Trans, useTranslation } from "~/context/Locale";
import { Animated, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { formatCurrencyUnit, getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import type { DRep } from "@ledgerhq/live-common/families/cardano/DRep";
import type {
  CardanoAccount,
  CardanoDelegation,
  TransactionStatus,
  Transaction,
  Transaction as CardanoTransaction,
} from "@ledgerhq/live-common/families/cardano/types";
import { Box, Text, Icons } from "@ledgerhq/native-ui";
import { AccountLike } from "@ledgerhq/types-live";
import Button from "~/components/Button";
import Circle from "~/components/Circle";
import CurrencyIcon from "~/components/CurrencyIcon";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import Touchable from "~/components/Touchable";
import LText from "~/components/LText";

import DRepImage from "./DRepImage";
import { ScreenName } from "~/const";
import ArrowRight from "~/icons/ArrowRight";
import { TrackScreen } from "~/analytics";
import { rgba } from "../../../colors";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { CardanoVoteDelegationFlowParamList } from "./types";
import TranslatedError from "~/components/TranslatedError";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import GenericErrorBottomModal from "~/components/GenericErrorBottomModal";
import RetryButton from "~/components/RetryButton";
import CancelButton from "~/components/CancelButton";
import SupportLinkError from "~/components/SupportLinkError";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import { useChangeValidatorRotateAnim } from "../../shared/useChangeValidatorRotateAnim";

type Props = StackNavigatorProps<
  CardanoVoteDelegationFlowParamList,
  ScreenName.CardanoVoteDelegationSummary
>;

export default function VoteDelegationSummary({ navigation, route }: Props) {
  const { drep } = route.params;
  const { colors } = useTheme();
  const { account, parentAccount } = useAccountScreen(route);
  invariant(account, "account must be defined");

  const { cardanoResources } = account as CardanoAccount;
  const currentDelegation = cardanoResources.delegation;
  const bridge = useAccountBridge<CardanoTransaction>(account, undefined);

  const chosenDRep = useMemo(() => {
    if (drep !== undefined) {
      return drep;
    }
    return undefined;
  }, [drep]);

  const effectiveDRepHex = chosenDRep ? chosenDRep.hex : route.params.option === "abstain" ? "2" : route.params.option === "noConfidence" ? "3" : undefined;



  let tx = bridge.createTransaction(account);
  tx = bridge.updateTransaction(tx, { mode: "voteDelegate" });
  const { transaction, setTransaction, status, bridgePending, bridgeError } =
    useBridgeTransaction(bridge, () => {
      if (chosenDRep) {
        tx = bridge.updateTransaction(tx, { dRepHex: chosenDRep.hex, dRepNoConfidence: undefined, dRepAbstain: undefined });
      } else if (route.params.option === "noConfidence") {
        tx = bridge.updateTransaction(tx, { dRepNoConfidence: true, dRepHex: undefined, dRepAbstain: undefined });
      } else if (route.params.option === "abstain") {
        tx = bridge.updateTransaction(tx, { dRepAbstain: true, dRepHex: undefined, dRepNoConfidence: undefined });
      }

      return { account, transaction: tx };
    });

  const [bridgeErr, setBridgeErr] = useState(bridgeError);
  useEffect(() => setBridgeErr(bridgeError), [bridgeError]);

  const onBridgeErrorCancel = useCallback(() => {
    setBridgeErr(null);
    const parent = navigation.getParent();
    if (parent) parent.goBack();
  }, [navigation]);
  const onBridgeErrorRetry = useCallback(() => {
    setBridgeErr(null);
    if (!transaction) return;
    setTransaction(bridge.updateTransaction(transaction, {}));
  }, [setTransaction, bridge, transaction]);

  invariant(transaction, "transaction must be defined");
  invariant(transaction.family === "cardano", "transaction cardano");

  useEffect(() => {
    const tmpTransaction = route.params.transaction;
    let nextTransaction = transaction;

    if (tmpTransaction) {
      nextTransaction = tmpTransaction;
    }

    if (chosenDRep) {
      nextTransaction = bridge.updateTransaction(nextTransaction, {
        mode: "voteDelegate",
        dRepHex: chosenDRep.hex,
      });
    } else if (route.params.option === "noConfidence") {
      nextTransaction = bridge.updateTransaction(nextTransaction, {
        mode: "voteDelegate",
        dRepNoConfidence: true,
      });
    } else if (route.params.option === "abstain") {
      nextTransaction = bridge.updateTransaction(nextTransaction, {
        mode: "voteDelegate",
        dRepAbstain: true,
      });
    }

    if (nextTransaction !== transaction) {
      setTransaction(nextTransaction);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params, setTransaction, chosenDRep]);

  const onChangeDRep = useCallback(() => {
    navigation.navigate(ScreenName.CardanoVoteDelegationStarted, {
      ...route.params,
      transaction,
    });
  }, [navigation, transaction, route.params]);

  const currency = getAccountCurrency(account);
  const color = getCurrencyColor(currency);

  const onContinue = useCallback(async () => {
    navigation.navigate(ScreenName.CardanoVoteDelegationSelectDevice, {
      accountId: account.id,
      parentId: parentAccount?.id || undefined,
      transaction,
      status,
    });
  }, [status, account, parentAccount, navigation, transaction]);

  const displayError = useMemo(() => {
    return status.errors.amount ? status.errors.amount : "";
  }, [status]);
  const displayWarning = useMemo(() => {
    return status.warnings.feeTooHigh ? status.warnings.feeTooHigh : "";
  }, [status]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="VoteDelegationFlow"
        name={route.params.skipStartedStep ? "Step Starter" : "Summary"}
        screen="Summary"
        flow="vote_delegate"
        action="delegation"
        currency="cardano"
      />
      <View style={styles.body}>
        <View style={styles.delegatingAccount}>
          <Circle size={50} bg={rgba(color, 0.2)}>
            <CurrencyIcon size={32} currency={currency} />
          </Circle>
          <AccountBalanceTag account={account} />
        </View>

        <View style={styles.summary}>
          <SummaryWords
            currentDelegation={currentDelegation}
            onChangeDRep={onChangeDRep}
            chosenDRep={chosenDRep ?? undefined}
            account={account}
            status={status}
            transaction={transaction}
            option={route?.params?.option}
          />
        </View>
      </View>
      <View style={styles.footer}>
        {displayError ? (
          <Box>
            <Text fontSize={13} color="red">
              <TranslatedError error={displayError} field="title" />
            </Text>
          </Box>
        ) : (
          <></>
        )}
        {displayWarning ? (
          <Box>
            <Text fontSize={13} color="orange">
              <TranslatedError error={displayWarning} field="title" />
            </Text>
          </Box>
        ) : (
          <></>
        )}
        {status.errors.sender ? (
          <Box>
            <Text fontSize={13} color="red">
              <TranslatedError error={status.errors.sender} />
            </Text>
            <Text fontSize={12} color="red">
              <TranslatedError error={status.errors.sender} field="description" />
            </Text>
            <SupportLinkError error={status.errors.sender} type="alert" />
          </Box>
        ) : (
          <></>
        )}
        <Button
          event="SummaryContinue"
          type="primary"
          title={<Trans i18nKey="common.continue" />}
          containerStyle={styles.continueButton}
          onPress={onContinue}
          disabled={
            Object.keys(status.errors).length > 0 ||
            bridgePending ||
            !!bridgeError ||
            !effectiveDRepHex ||
            (currentDelegation && currentDelegation.dRepHex === effectiveDRepHex)
          }
          pending={bridgePending}
          testID="cardano-vote-summary-continue-button"
        />
      </View>
      <GenericErrorBottomModal
        error={bridgeErr}
        onClose={onBridgeErrorRetry}
        footerButtons={
          <>
            <CancelButton containerStyle={styles.button} onPress={onBridgeErrorCancel} />
            <RetryButton
              containerStyle={[styles.button, styles.buttonRight]}
              onPress={onBridgeErrorRetry}
            />
          </>
        }
      />
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
  poolCircle: {
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
  summarySection: {
    flexDirection: "column",
    alignItems: "flex-start",
    width: "100%",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 5,
    width: "100%",
  },
  labelText: {
    paddingRight: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  valueWrapper: {
    alignItems: "flex-end",
  },
  valueText: {
    fontSize: 14,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
  buttonRight: {
    marginLeft: 8,
  },
});

function SummaryWords({
  chosenDRep,
  account,
  currentDelegation,
  onChangeDRep,
  status,
  transaction,
  option,
}: {
  chosenDRep?: DRep;
  account: AccountLike;
  currentDelegation?: CardanoDelegation;
  onChangeDRep: () => void;
  status: TransactionStatus;
  transaction: Transaction;
  option?: string;
}) {
  const unit = useAccountUnit(account);
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { rotate } = useChangeValidatorRotateAnim();

  const optionText = useMemo(() => {
    if (option === "abstain") return t("cardano.voteDelegation.options.alwaysAbstain");
    if (option === "noConfidence") return t("cardano.voteDelegation.options.alwaysNoConfidence");
    if (chosenDRep) {
      if (chosenDRep.hex === "2") return t("cardano.voteDelegation.options.alwaysAbstain");
      if (chosenDRep.hex === "3") return t("cardano.voteDelegation.options.alwaysNoConfidence");
      return chosenDRep.meta?.givenName || chosenDRep.hex;
    }
    return t("cardano.delegation.select");
  }, [option, chosenDRep, t]);

  const formatConfig = {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
  };

  return (
    <>
      <View style={styles.summarySection}>
        {currentDelegation && currentDelegation.dRepHex && (
          <View style={[{ flexDirection: "column", marginBottom: 30 }]}>
            <View>
              <Text numberOfLines={1} fontWeight={"medium"} fontSize={14} color={"smoke"}>
                {t("cardano.voteDelegation.currentlyVotingFor")}
              </Text>
            </View>
            <View
              style={[
                {
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 15,
                  minWidth: "100%",
                },
              ]}
            >
              <Circle
                size={50}
                style={[styles.poolCircle, { borderColor: colors.primary, borderStyle: "solid" }]}
              >
                <DRepImage size={50} name={currentDelegation.dRepHex} />
              </Circle>
              <Text
                style={[{ marginLeft: 15, flex: 1, flexGrow: 1 }]}
                numberOfLines={1}
                fontWeight={"semiBold"}
                ellipsizeMode="tail"
                fontSize={18}
              >
                {currentDelegation.dRepHex === "2"
                  ? t("cardano.voteDelegation.options.alwaysAbstain")
                  : currentDelegation.dRepHex === "3"
                  ? t("cardano.voteDelegation.options.alwaysNoConfidence")
                  : currentDelegation.dRepHex}
              </Text>
            </View>
          </View>
        )}
        <View style={[{ flexDirection: "column", marginBottom: 10 }]}>
          <View>
            <Text numberOfLines={1} fontWeight={"medium"} fontSize={14} color={"smoke"}>
              {t("cardano.voteDelegation.delegatingTo")}
            </Text>
          </View>

          <Touchable event="VoteDelegationFlowSummaryChangeCircleBtn" onPress={onChangeDRep}>
            <View
              style={[
                {
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 15,
                  minWidth: "100%",
                },
              ]}
            >
              <Circle size={50} style={[styles.poolCircle, { borderColor: colors.primary }]}>
                <Animated.View
                  style={{
                    transform: [
                      {
                        rotate,
                      },
                    ],
                  }}
                >
                  <DRepImage
                    size={50}
                    name={
                      chosenDRep
                        ? chosenDRep.meta?.givenName || chosenDRep.hex
                        : option === "abstain"
                        ? "2"
                        : option === "noConfidence"
                        ? "3"
                        : " "
                    }
                  />
                </Animated.View>
                <Circle style={styles.changeDelegator} bg={colors.primary} size={26}>
                  <Icons.PenEdit size="XS" color="neutral.c100" />
                </Circle>
              </Circle>
              <Text
                style={[{ marginLeft: 15, flex: 1, flexGrow: 1 }]}
                numberOfLines={1}
                ellipsizeMode="tail"
                fontWeight={"semiBold"}
                fontSize={18}
                testID="cardano-vote-delegation-summary-drep"
              >
                {optionText}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginLeft: 10,
                }}
              >
                <LText style={{ fontSize: 14 }} color="live">
                  {chosenDRep || option ? t("cardano.delegation.change") : t("cardano.delegation.select")}
                </LText>
                <ArrowRight color={colors.live} size={14} />
              </View>
            </View>
          </Touchable>
        </View>

        <View
          style={[
            {
              borderBottomWidth: 1,
              borderBottomColor: colors.lightFog,
              width: "100%",
              marginVertical: 10,
            },
          ]}
        />
        <DataField
          label={t("cardano.delegation.networkFees")}
          Component={
            <LText
              numberOfLines={1}
              semiBold
              ellipsizeMode="middle"
              style={[styles.valueText]}
              testID="cardano-vote-delegation-summary-fees"
            >
              {formatCurrencyUnit(unit, new BigNumber(status.estimatedFees), formatConfig)}
            </LText>
          }
        />
        {!(currentDelegation && (currentDelegation.poolId || currentDelegation.dRepHex)) ? (
          <DataField
            label={t("cardano.delegation.stakeKeyRegistrationDeposit")}
            Component={
              <LText numberOfLines={1} semiBold ellipsizeMode="middle" style={[styles.valueText]}>
                {formatCurrencyUnit(
                  unit,
                  new BigNumber(transaction.protocolParams?.stakeKeyDeposit ?? "0"),
                  formatConfig,
                )}
              </LText>
            }
          />
        ) : (
          <></>
        )}
      </View>
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

type FieldType = {
  label: ReactNode;
  Component: ReactNode;
};

function DataField({ label, Component }: FieldType) {
  return (
    <View style={styles.row}>
      <View>
        <LText numberOfLines={1} style={styles.labelText} color="smoke">
          {label}
        </LText>
      </View>

      <View style={styles.valueWrapper}>{Component}</View>
    </View>
  );
}
