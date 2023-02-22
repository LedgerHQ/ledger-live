import { BigNumber } from "bignumber.js";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import React, { useCallback, useState, useEffect } from "react";
import { View, StyleSheet, SafeAreaView } from "react-native";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import invariant from "invariant";
import { useTheme } from "@react-navigation/native";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import { getMainAccount } from "@ledgerhq/live-common/account/helpers";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useDebounce } from "@ledgerhq/live-common/hooks/useDebounce";
import { rgba, Text } from "@ledgerhq/native-ui";
import { CeloAccount } from "@ledgerhq/live-common/families/celo/types";
import Icon from "react-native-vector-icons/Feather";
import { accountScreenSelector } from "../../../reducers/accounts";
import { ScreenName } from "../../../const";
import { TrackScreen } from "../../../analytics";
import Button from "../../../components/Button";
import Touchable from "../../../components/Touchable";
import SendRowsFee from "../SendRowsFee";
import Clock from "../../../icons/Clock";
import LText from "../../../components/LText";
import QueuedDrawer from "../../../components/QueuedDrawer";
import InfoIcon from "../../../components/InfoIcon";
import Line from "../components/Line";
import Words from "../components/Words";
import ErrorAndWarning from "../components/ErrorAndWarning";
import type {
  BaseComposite,
  StackNavigatorProps,
} from "../../../components/RootNavigator/types/helpers";
import type { CeloWithdrawFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<CeloWithdrawFlowParamList, ScreenName.CeloWithdrawAmount>
>;

export default function WithdrawAmount({ navigation, route }: Props) {
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const openModal = useCallback(
    time => setInfoModalOpen(time),
    [setInfoModalOpen],
  );
  const closeModal = useCallback(
    () => setInfoModalOpen(false),
    [setInfoModalOpen],
  );
  const { colors } = useTheme();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  invariant(account, "account is required");

  const bridge = getAccountBridge(account, parentAccount);
  const mainAccount = getMainAccount(account, parentAccount);

  const { transaction, setTransaction, status, bridgeError, bridgePending } =
    useBridgeTransaction(() => {
      const t = bridge.createTransaction(mainAccount);
      const transaction = bridge.updateTransaction(t, {
        mode: "withdraw",
      });
      return { account: mainAccount, transaction };
    });

  invariant(transaction, "transaction must be defined");
  invariant(transaction.family === "celo", "not a celo transaction");

  const debouncedTransaction = useDebounce(transaction, 500);

  useEffect(() => {
    if (!account) return;
    bridge.prepareTransaction(account as CeloAccount, debouncedTransaction);
  }, [account, parentAccount, transaction, bridge, debouncedTransaction]);

  const onChange = useCallback(
    index => {
      if (index != null) {
        setTransaction(bridge.updateTransaction(transaction, { index }));
      }
    },
    [setTransaction, transaction, bridge],
  );

  const onContinue = () => {
    navigation.navigate(ScreenName.CeloWithdrawSelectDevice, {
      ...route.params,
      transaction,
    });
  };

  if (!account || !transaction) return null;
  const { pendingWithdrawals } = (account as CeloAccount).celoResources;

  if (pendingWithdrawals) {
    if (
      (transaction.index === null || transaction.index === undefined) &&
      pendingWithdrawals[0]
    ) {
      onChange(pendingWithdrawals[0].index);
    }
  }
  const unit = getAccountUnit(account);
  const formatAmount = (val: BigNumber) => {
    return formatCurrencyUnit(unit, val, {
      disableRounding: true,
      alwaysShowSign: false,
      showCode: true,
    });
  };

  // Note: if we want to mimick the same behavior as LLD, we'll need MomentJS to handle all date edge cases
  const getDate = (time: string) => {
    return new Date(parseInt(time, 10) * 1000).toLocaleDateString();
  };

  const hasErrors = Object.keys(status.errors).length > 0;
  const error =
    status.errors &&
    Object.keys(status.errors).length > 0 &&
    Object.values(status.errors)[0];
  const warning =
    status.warnings &&
    Object.keys(status.warnings).length > 0 &&
    Object.values(status.warnings)[0];

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen category="CeloWithdraw" name="Amount" />
      <View style={styles.body}>
        <View style={styles.amount}>
          <Line>
            <Words>
              <Trans i18nKey={`celo.withdraw.iWithdraw`} />
            </Words>
          </Line>

          {pendingWithdrawals != null && pendingWithdrawals.length > 0 ? (
            pendingWithdrawals.map(({ value, time, index }) => {
              const withdrawalTime = new Date(time.toNumber() * 1000);
              const disabled = withdrawalTime > new Date();
              return transaction.index === index ? (
                <CustomSelectable
                  selected={true}
                  name={formatAmount(value)}
                  hasClock={disabled}
                />
              ) : (
                <Touchable
                  onPress={
                    disabled ? () => openModal(time) : () => onChange(index)
                  }
                >
                  <CustomSelectable
                    selected={false}
                    name={formatAmount(value)}
                    hasClock={disabled}
                  />
                </Touchable>
              );
            })
          ) : (
            <Text>
              <Trans i18nKey={`errors.CeloMissingWithdrawalsError.title`} />
            </Text>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        {!!(error && error instanceof Error) && (
          <ErrorAndWarning error={error} />
        )}
        {!!(warning && warning instanceof Error) && (
          <ErrorAndWarning warning={warning} />
        )}
        <View style={styles.feesRow}>
          <SendRowsFee
            account={account}
            transaction={transaction}
            navigation={navigation}
            route={route}
          />
        </View>
        <Button
          event="CeloWithdrawAmountContinue"
          type="primary"
          title={
            <Trans
              i18nKey={
                !bridgePending
                  ? "common.continue"
                  : "send.amount.loadingNetwork"
              }
            />
          }
          containerStyle={styles.continueButton}
          onPress={onContinue}
          disabled={bridgePending || !!bridgeError || hasErrors}
          pending={bridgePending}
        />
      </View>
      <QueuedDrawer
        isRequestingToBeOpened={!!infoModalOpen}
        onClose={closeModal}
      >
        <View style={styles.modal}>
          <View style={styles.infoIcon}>
            <InfoIcon bg={colors.lightLive}>
              <Clock color={colors.live} size={30} />
            </InfoIcon>
          </View>
          <View style={styles.infoRow}>
            <LText style={[styles.warnText, styles.title]} semiBold>
              <Trans i18nKey={`celo.withdraw.flow.steps.amount.waitingTitle`} />
            </LText>
            <LText style={styles.warnText} color="grey">
              <Trans
                i18nKey={`celo.withdraw.flow.steps.amount.waitingPeriod`}
                values={{ date: getDate(infoModalOpen.toString()) }}
              />
            </LText>
          </View>
        </View>
      </QueuedDrawer>
    </SafeAreaView>
  );
}

const CustomSelectable = React.memo(
  ({
    name,
    selected,
    hasClock,
  }: {
    name: string;
    selected: boolean;
    hasClock: boolean;
  }) => {
    const { colors } = useTheme();
    const color = selected ? colors.primary : colors.grey;
    return (
      <View
        style={[
          styles.validatorSelection,
          { backgroundColor: rgba(color, 0.2) },
        ]}
      >
        <View style={styles.clockContainer}>
          <View style={styles.clockIcon}>
            {!!hasClock && <Clock color={colors.grey} size={18} />}
          </View>
        </View>
        <Text
          fontWeight="bold"
          numberOfLines={1}
          style={styles.validatorSelectionText}
          color={color}
        >
          {name}
        </Text>

        <View
          style={[styles.validatorSelectionIcon, { backgroundColor: color }]}
        >
          {!!selected && <Icon size={16} name="check" color={colors.white} />}
        </View>
      </View>
    );
  },
);

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
  amount: {
    alignItems: "center",
    marginVertical: 30,
  },
  infoIcon: {
    width: 80,
  },
  title: {
    lineHeight: 24,
    fontSize: 16,
  },
  warnText: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 16,
    marginVertical: 12,
  },
  modal: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  infoRow: {
    paddingHorizontal: 16,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  validatorSelection: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 4,
    height: 40,
    marginTop: 8,
  },
  validatorSelectionText: {
    paddingHorizontal: 8,
    fontSize: 18,
    width: 180,
    textAlign: "right",
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
  feesRow: {
    width: 330,
  },
  continueButton: {
    alignSelf: "stretch",
    marginTop: 12,
  },
  clockContainer: {
    width: 12,
  },
  clockIcon: {
    paddingLeft: 12,
  },
});
