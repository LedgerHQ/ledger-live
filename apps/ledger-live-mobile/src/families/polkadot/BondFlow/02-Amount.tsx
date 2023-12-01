import { BigNumber } from "bignumber.js";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import React, { useCallback, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  Switch,
  Keyboard,
  TouchableOpacity,
  SafeAreaView,
  Linking,
} from "react-native";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import invariant from "invariant";
import { useTheme } from "@react-navigation/native";
import type { Transaction as PolkadotTransaction } from "@ledgerhq/live-common/families/polkadot/types";
import { useDebounce } from "@ledgerhq/live-common/hooks/useDebounce";
import { getAccountUnit, getMainAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { isFirstBond } from "@ledgerhq/live-common/families/polkadot/logic";
import { PolkadotAccount } from "@ledgerhq/live-common/families/polkadot/types";
import { urls } from "~/utils/urls";
import { accountScreenSelector } from "~/reducers/accounts";
import { ScreenName } from "~/const";
import { TrackScreen } from "~/analytics";
import LText from "~/components/LText";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import Button from "~/components/Button";
import ToggleButton from "~/components/ToggleButton";
import KeyboardView from "~/components/KeyboardView";
import CurrencyInput from "~/components/CurrencyInput";
import TranslatedError from "~/components/TranslatedError";
import InfoModal from "~/modals/Info";
import Info from "~/icons/Info";
import { getFirstStatusError, hasStatusError } from "../../helpers";
import FlowErrorBottomModal from "../components/FlowErrorBottomModal";
import SendRowsFee from "../SendRowsFee";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { PolkadotBondFlowParamList } from "./types";

const options = [
  {
    value: "Stash",
    label: <Trans i18nKey="polkadot.bond.rewardDestination.stash" />,
  },
  {
    value: "Staked",
    label: <Trans i18nKey="polkadot.bond.rewardDestination.staked" />,
  },
];
const infoModalData = [
  {
    title: <Trans i18nKey="polkadot.bond.rewardDestination.stash" />,
    description: <Trans i18nKey="polkadot.bond.rewardDestination.stashDescription" />,
  },
  {
    title: <Trans i18nKey="polkadot.bond.rewardDestination.staked" />,
    description: <Trans i18nKey="polkadot.bond.rewardDestination.stakedDescription" />,
  },
  {
    title: <Trans i18nKey="polkadot.bond.rewardDestination.optionTitle" />,
    description: (
      <>
        <Trans i18nKey="polkadot.bond.rewardDestination.optionDescription" />
        <LText onPress={() => Linking.openURL(urls.polkadotStaking)}>
          <Trans i18nKey={"polkadot.bond.rewardDestination.clickableLink"} />
        </LText>
      </>
    ),
  },
];

type Props = BaseComposite<
  StackNavigatorProps<PolkadotBondFlowParamList, ScreenName.PolkadotBondAmount>
>;

export default function PolkadotBondAmount({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  invariant(account, "account is required");
  const bridge = getAccountBridge(account, parentAccount);
  const mainAccount = getMainAccount(account, parentAccount) as PolkadotAccount;
  const [maxSpendable, setMaxSpendable] = useState<BigNumber | null>(null);
  const [infoModalOpen, setInfoModalOpen] = useState<boolean>();
  const bridgeTransaction = useBridgeTransaction(() => {
    const t = bridge.createTransaction(mainAccount);
    const transaction = bridge.updateTransaction(t, {
      mode: "bond",
      recipient: mainAccount.freshAddress,
      rewardDestination: "Stash",
    });
    return {
      account: mainAccount,
      transaction,
    };
  });
  const { setTransaction, status, bridgePending, bridgeError } = bridgeTransaction;
  const transaction = bridgeTransaction.transaction as PolkadotTransaction;
  const debouncedTransaction = useDebounce(transaction, 500);
  useEffect(() => {
    if (!account) return;
    let cancelled = false;
    getAccountBridge(account, parentAccount)
      .estimateMaxSpendable({
        account,
        parentAccount,
        transaction: debouncedTransaction,
      })
      .then(estimate => {
        if (cancelled) return;
        setMaxSpendable(estimate);
      });
    // eslint-disable-next-line consistent-return
    return () => {
      cancelled = true;
    };
  }, [account, parentAccount, debouncedTransaction]);
  const onChange = useCallback(
    (amount: BigNumber) => {
      if (!amount.isNaN()) {
        setTransaction(
          bridge.updateTransaction(transaction, {
            amount,
          }),
        );
      }
    },
    [setTransaction, transaction, bridge],
  );
  const toggleUseAllAmount = useCallback(() => {
    const bridge = getAccountBridge(account, parentAccount);
    if (!transaction) return;
    setTransaction(
      bridge.updateTransaction(transaction, {
        amount: BigNumber(0),
        useAllAmount: !transaction.useAllAmount,
      }),
    );
  }, [setTransaction, account, parentAccount, transaction]);
  const onContinue = useCallback(() => {
    navigation.navigate(ScreenName.PolkadotBondSelectDevice, {
      accountId: account.id,
      transaction,
      status,
    });
  }, [account, navigation, transaction, status]);
  const blur = useCallback(() => Keyboard.dismiss(), []);
  const openInfoModal = useCallback(() => {
    setInfoModalOpen(true);
  }, [setInfoModalOpen]);
  const closeInfoModal = useCallback(() => {
    setInfoModalOpen(false);
  }, [setInfoModalOpen]);
  const onChangeRewardDestination = useCallback(
    (rewardDestination: string) => {
      setTransaction(
        bridge.updateTransaction(transaction, {
          rewardDestination,
        }),
      );
    },
    [bridge, transaction, setTransaction],
  );
  if (!account || !transaction) return null;
  const { useAllAmount } = transaction;
  const { amount } = status;
  const unit = getAccountUnit(account);
  const rewardDestination = (transaction as { rewardDestination?: string }).rewardDestination || "";
  const firstBond = isFirstBond(mainAccount);
  const error = amount.eq(0) || bridgePending ? null : getFirstStatusError(status, "errors");
  const warning = getFirstStatusError(status, "warnings");
  const hasErrors = hasStatusError(status);
  return (
    <>
      <TrackScreen category="BondFlow" name="Amount" flow="stake" action="bond" currency="dot" />
      <SafeAreaView
        style={[
          styles.root,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <KeyboardView style={styles.container}>
          {firstBond ? (
            <View style={styles.topContainer}>
              <TouchableOpacity onPress={openInfoModal} style={styles.info}>
                <LText semiBold style={styles.infoLabel} color="grey">
                  <Trans i18nKey="polkadot.bond.rewardDestination.label" />
                </LText>
                <Info size={16} color={colors.grey} />
              </TouchableOpacity>
              <ToggleButton
                value={rewardDestination}
                options={options}
                onChange={onChangeRewardDestination}
              />
            </View>
          ) : null}
          <TouchableWithoutFeedback onPress={blur}>
            <View
              style={[
                styles.root,
                {
                  backgroundColor: colors.background,
                },
              ]}
            >
              <View style={styles.wrapper}>
                <CurrencyInput
                  editable={!useAllAmount}
                  isActive
                  onChange={onChange}
                  unit={unit}
                  value={amount}
                  renderRight={
                    <LText
                      semiBold
                      style={[styles.currency]}
                      color={error ? "alert" : warning ? "orange" : "grey"}
                    >
                      {unit.code}
                    </LText>
                  }
                  style={styles.inputContainer}
                  inputStyle={[
                    styles.inputStyle,
                    warning && {
                      color: colors.orange,
                    },
                    error && {
                      color: colors.alert,
                    },
                  ]}
                  hasError={!!error}
                  hasWarning={!!warning}
                />
                <LText
                  style={[styles.fieldStatus]}
                  color={error ? "alert" : warning ? "orange" : "darkBlue"}
                  numberOfLines={2}
                >
                  <TranslatedError error={error || warning} />
                </LText>
              </View>
              <View style={styles.bottomWrapper}>
                <View style={styles.available}>
                  <View style={styles.availableLeft}>
                    <LText>
                      <Trans i18nKey="polkadot.bond.steps.amount.availableLabel" />
                    </LText>
                    <LText semiBold>
                      {maxSpendable ? (
                        <CurrencyUnitValue showCode unit={unit} value={maxSpendable} />
                      ) : (
                        "-"
                      )}
                    </LText>
                  </View>
                  {typeof useAllAmount === "boolean" ? (
                    <View style={styles.availableRight}>
                      <LText style={styles.maxLabel}>
                        <Trans i18nKey="polkadot.bond.steps.amount.maxLabel" />
                      </LText>
                      <Switch
                        style={styles.switch}
                        value={useAllAmount}
                        onValueChange={toggleUseAllAmount}
                      />
                    </View>
                  ) : null}
                </View>
                <SendRowsFee
                  account={account}
                  transaction={transaction}
                  navigation={navigation}
                  route={route}
                />
                <View style={styles.continueWrapper}>
                  <Button
                    event="PolkadotBondAmountContinue"
                    type="primary"
                    title={
                      <Trans
                        i18nKey={!bridgePending ? "common.continue" : "send.amount.loadingNetwork"}
                      />
                    }
                    onPress={onContinue}
                    disabled={!!hasErrors || bridgePending}
                  />
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardView>
      </SafeAreaView>

      <InfoModal isOpened={!!infoModalOpen} onClose={closeInfoModal} data={infoModalData} />

      <FlowErrorBottomModal
        navigation={navigation}
        transaction={transaction}
        account={account}
        parentAccount={parentAccount}
        setTransaction={setTransaction}
        bridgeError={bridgeError}
      />
    </>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topContainer: {
    paddingHorizontal: 32,
    flexShrink: 1,
  },
  container: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
    alignItems: "stretch",
    justifyContent: "flex-start",
  },
  available: {
    flexDirection: "row",
    display: "flex",
    flexGrow: 1,
  },
  availableRight: {
    alignItems: "center",
    justifyContent: "flex-end",
    flexDirection: "row",
  },
  availableLeft: {
    justifyContent: "center",
    flexGrow: 1,
  },
  maxLabel: {
    marginRight: 4,
  },
  bottomWrapper: {
    flexGrow: 0,
    alignItems: "stretch",
    justifyContent: "flex-end",
    flexShrink: 1,
  },
  continueWrapper: {
    alignSelf: "stretch",
    alignItems: "stretch",
    justifyContent: "flex-end",
    paddingBottom: 16,
  },
  wrapper: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: "column",
    alignContent: "center",
    justifyContent: "center",
  },
  inputContainer: {
    flexBasis: 75,
  },
  inputStyle: {
    flex: 0,
    flexShrink: 1,
    textAlign: "center",
  },
  currency: {
    fontSize: 32,
  },
  fieldStatus: {
    fontSize: 14,
    textAlign: "center",
  },
  info: {
    flexShrink: 1,
    marginTop: 8,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: {
    marginRight: 10,
  },
  switch: {
    opacity: 0.99,
  },
});
