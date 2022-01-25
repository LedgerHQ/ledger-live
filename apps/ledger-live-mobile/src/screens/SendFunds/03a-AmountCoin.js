/* @flow */
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
import SafeAreaView from "react-native-safe-area-view";
import { useSelector } from "react-redux";
import { Trans, useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";

import useBridgeTransaction from "@ledgerhq/live-common/lib/bridge/useBridgeTransaction";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import type { Transaction } from "@ledgerhq/live-common/lib/types";
import { useDebounce } from "@ledgerhq/live-common/lib/hooks/useDebounce";
import { getAccountUnit } from "@ledgerhq/live-common/lib/account";
import { getAccountCurrency } from "@ledgerhq/live-common/lib/account/helpers";

import { ScreenName } from "../../const";
import { urls } from "../../config/urls";
import { accountScreenSelector } from "../../reducers/accounts";
import { TrackScreen } from "../../analytics";

import LText from "../../components/LText";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import Touchable from "../../components/Touchable";
import Button from "../../components/Button";
import KeyboardView from "../../components/KeyboardView";
import RetryButton from "../../components/RetryButton";
import CancelButton from "../../components/CancelButton";
import ExternalLink from "../../components/ExternalLink";
import GenericErrorBottomModal from "../../components/GenericErrorBottomModal";
import InfoModal from "../../modals/Info";
import type { ModalInfo } from "../../modals/Info";
import InfoIcon from "../../icons/Info";

import AmountInput from "./AmountInput";

const forceInset = { bottom: "always" };

type ModalInfoName = "maxSpendable";

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

type RouteParams = {
  accountId: string,
  transaction: Transaction,
};

export default function SendAmountCoin({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  const [maxSpendable, setMaxSpendable] = useState(null);
  const {
    modalInfos,
    modalInfoName,
    openInfoModal,
    closeInfoModal,
  } = useModalInfo();

  const {
    transaction,
    setTransaction,
    status,
    bridgePending,
    bridgeError,
  } = useBridgeTransaction(() => ({
    transaction: route.params.transaction,
    account,
    parentAccount,
  }));

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
    amount => {
      if (!amount.isNaN()) {
        if (!account) return;
        const bridge = getAccountBridge(account, parentAccount);
        setTransaction(bridge.updateTransaction(transaction, { amount }));
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
        amount: BigNumber(0),
        useAllAmount: !transaction.useAllAmount,
      }),
    );
  }, [setTransaction, account, parentAccount, transaction]);

  const onContinue = useCallback(() => {
    navigation.navigate(ScreenName.SendSummary, {
      accountId: account.id,
      parentId: parentAccount && parentAccount.id,
      transaction,
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
      <TrackScreen
        category="SendFunds"
        name="Amount"
        currencyName={currency.name}
      />
      <SafeAreaView
        style={[styles.root, { backgroundColor: colors.background }]}
        forceInset={forceInset}
      >
        <KeyboardView style={styles.container}>
          <TouchableWithoutFeedback onPress={blur}>
            <View style={styles.amountWrapper}>
              <AmountInput
                editable={!useAllAmount}
                account={account}
                onChange={onChange}
                value={amount}
                error={
                  amount.eq(0) && (bridgePending || !transaction.useAllAmount)
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
                          <CurrencyUnitValue
                            showCode
                            unit={unit}
                            value={maxSpendable}
                          />
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
                    event="SendAmountCoinContinue"
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
                    onPress={onContinue}
                    disabled={!!status.errors.amount || bridgePending}
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
            <CancelButton
              containerStyle={styles.button}
              onPress={onBridgeErrorCancel}
            />
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
  modalInfos: { [key: ModalInfoName]: ModalInfo[] },
  modalInfoName: ModalInfoName | null,
  openInfoModal: (infoName: ModalInfoName) => void,
  closeInfoModal: () => void,
} {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [modalInfoName, setModalInfoName] = useState(null);

  const onMaxSpendableLearnMore = useCallback(
    () => Linking.openURL(urls.maxSpendable),
    [],
  );

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
              ltextProps={{
                style: [styles.learnMore, { color: colors.live }],
              }}
              color={colors.live}
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
