import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import React, { useCallback, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  Switch,
  Keyboard,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { Trans, useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { useDebounce } from "@ledgerhq/live-common/hooks/useDebounce";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import { ScreenName } from "~/const";
import { urls } from "~/utils/urls";
import { accountScreenSelector } from "~/reducers/accounts";
import { TrackScreen } from "~/analytics";
import LText from "~/components/LText";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import Touchable from "~/components/Touchable";
import Button from "~/components/Button";
import KeyboardView from "~/components/KeyboardView";
import RetryButton from "~/components/RetryButton";
import CancelButton from "~/components/CancelButton";
import ExternalLink from "~/components/ExternalLink";
import GenericErrorBottomModal from "~/components/GenericErrorBottomModal";
import InfoModal from "~/modals/Info";
import type { ModalInfo } from "~/modals/Info";
import InfoIcon from "~/icons/Info";
import AmountInput from "./AmountInput";
import type { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";

type ModalInfoName = "maxSpendable";
type Props = StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.SendAmountCoin>;

export default function SendAmountCoin({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  const [maxSpendable, setMaxSpendable] = useState<BigNumber | null>(null);
  const { modalInfos, modalInfoName, openInfoModal, closeInfoModal } = useModalInfo();
  const { transaction, setTransaction, status, bridgePending, bridgeError } = useBridgeTransaction(
    () => ({
      transaction: route.params.transaction,
      account,
      parentAccount,
    }),
  );
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
  invariant(account, "account is needed");
  const onChange = useCallback(
    (amount: BigNumber) => {
      if (!amount.isNaN()) {
        if (!account) return;
        const bridge = getAccountBridge(account, parentAccount);
        setTransaction(
          bridge.updateTransaction(transaction, {
            amount,
          }),
        );
      }
    },
    [setTransaction, account, parentAccount, transaction],
  );
  const toggleUseAllAmount = useCallback(() => {
    if (!account) return;
    const bridge = getAccountBridge(account, parentAccount);
    if (!transaction) return;
    setTransaction(
      bridge.updateTransaction(transaction, {
        amount: new BigNumber(0),
        useAllAmount: !transaction.useAllAmount,
      }),
    );
  }, [setTransaction, account, parentAccount, transaction]);
  const onContinue = useCallback(() => {
    if (!transaction) return;
    navigation.navigate(ScreenName.SendSummary, {
      accountId: account.id,
      parentId: parentAccount?.id,
      transaction,
      currentNavigation: ScreenName.SendSummary,
      nextNavigation: ScreenName.SendSelectDevice,
    });
  }, [account, parentAccount, navigation, transaction]);
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
    const bridge = getAccountBridge(account, parentAccount);
    setTransaction(bridge.updateTransaction(transaction, {}));
  }, [setTransaction, account, parentAccount, transaction]);
  const blur = useCallback(() => Keyboard.dismiss(), []);
  if (!account || !transaction) return null;
  const { useAllAmount } = transaction;
  const { amount } = status;
  const unit = getAccountUnit(account);
  const currency = getAccountCurrency(account);

  return (
    <>
      <TrackScreen category="SendFunds" name="Amount" currencyName={currency.name} />
      <SafeAreaView
        style={[
          styles.root,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <KeyboardView style={styles.container} behavior="padding">
          <TouchableWithoutFeedback onPress={blur}>
            <View style={styles.amountWrapper}>
              <AmountInput
                testID="amount-input"
                editable={!useAllAmount}
                account={account}
                onChange={onChange}
                value={amount}
                error={
                  status.errors.dustLimit
                    ? status.errors.dustLimit
                    : amount.eq(0) && (bridgePending || !transaction.useAllAmount)
                    ? null
                    : status.errors.amount
                }
                warning={status.warnings.amount}
              />

              <View style={styles.bottomWrapper}>
                <View style={[styles.available]}>
                  <Touchable
                    style={styles.availableLeft}
                    event={"MaxSpendableInfo"}
                    onPress={() => openInfoModal("maxSpendable")}
                  >
                    <View>
                      <LText color="grey">
                        <Trans i18nKey="send.amount.available" />{" "}
                        <InfoIcon size={12} color="grey" />
                      </LText>
                      {maxSpendable && (
                        <LText semiBold color="grey">
                          <CurrencyUnitValue showCode unit={unit} value={maxSpendable} />
                        </LText>
                      )}
                    </View>
                  </Touchable>
                  {typeof useAllAmount === "boolean" ? (
                    <View style={styles.availableRight}>
                      <LText style={styles.maxLabel} color="grey">
                        <Trans i18nKey="send.amount.useMax" />
                      </LText>
                      <Switch
                        style={styles.switch}
                        value={useAllAmount}
                        onValueChange={toggleUseAllAmount}
                      />
                    </View>
                  ) : null}
                </View>
                <View style={styles.continueWrapper}>
                  <Button
                    testID="amount-continue-button"
                    event="SendAmountCoinContinue"
                    type="primary"
                    title={
                      <Trans
                        i18nKey={!bridgePending ? "common.continue" : "send.amount.loadingNetwork"}
                      />
                    }
                    onPress={onContinue}
                    disabled={!!status.errors.amount || !!status.errors.dustLimit || bridgePending}
                  />
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardView>
      </SafeAreaView>

      <InfoModal
        isOpened={!!modalInfoName}
        onClose={closeInfoModal}
        data={modalInfoName ? modalInfos[modalInfoName] : []}
      />

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
    </>
  );
}

function useModalInfo(): {
  modalInfos: Record<ModalInfoName, ModalInfo[]>;
  modalInfoName: ModalInfoName | null;
  openInfoModal: (_: ModalInfoName) => void;
  closeInfoModal: () => void;
} {
  const { t } = useTranslation();
  const [modalInfoName, setModalInfoName] = useState<ModalInfoName | null>(null);
  const onMaxSpendableLearnMore = useCallback(() => Linking.openURL(urls.maxSpendable), []);
  return {
    openInfoModal: (infoName: ModalInfoName) => setModalInfoName(infoName),
    closeInfoModal: () => setModalInfoName(null),
    modalInfoName,
    modalInfos: {
      maxSpendable: [
        {
          title: t("send.info.maxSpendable.title"),
          description: t("send.info.maxSpendable.description"),
          footer: (
            <ExternalLink
              text={t("common.learnMore")}
              onPress={onMaxSpendableLearnMore}
              event="maxSpendableLearnMore"
            />
          ),
        },
      ],
    },
  };
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    alignItems: "stretch",
  },
  available: {
    flexDirection: "row",
    display: "flex",
    flexGrow: 1,
    marginBottom: 16,
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
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  continueWrapper: {
    alignSelf: "stretch",
    alignItems: "stretch",
    justifyContent: "flex-end",
    paddingBottom: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
  buttonRight: {
    marginLeft: 8,
  },
  amountWrapper: {
    flex: 1,
  },
  switch: {
    opacity: 0.99,
  },
  infoDescriptionWrapper: {
    flex: 0,
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "red",
    width: 100,
  },
  infoDescription: {
    flexShrink: 1,
    marginBottom: 14,
  },
  learnMore: {
    marginRight: 4,
    alignSelf: "flex-end",
  },
});
