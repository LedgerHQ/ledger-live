import React, { useMemo, useEffect, useCallback } from "react";
import { Image, View, Animated } from "react-native";
import { useTheme } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { handleTransactionStatus } from "@ledgerhq/live-common/families/elrond/helpers/handleTransactionStatus";
import { denominate } from "@ledgerhq/live-common/families/elrond/helpers/denominate";
import { getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import {
  getAccountCurrency,
  getAccountUnit,
  getMainAccount,
} from "@ledgerhq/live-common/account/index";
import { Text } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import BigNumber from "bignumber.js";

import Icon from "react-native-vector-icons/Feather";
import { ELROND_LEDGER_VALIDATOR_ADDRESS } from "@ledgerhq/live-common/families/elrond/constants";

import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import Button from "~/components/Button";
import FirstLetterIcon from "~/components/FirstLetterIcon";
import Circle from "~/components/Circle";
import Touchable from "~/components/Touchable";
import LedgerLogo from "~/icons/LiveLogo";
import CurrencyIcon from "~/components/CurrencyIcon";
import { TrackScreen } from "~/analytics";
import { ScreenName } from "~/const";

import { rgba } from "../../../../../../../colors";

import type { SetDelegationPropsType } from "./types";

import styles from "./styles";

/*
 * Handle the component declaration.
 */

const SetDelegation = (props: SetDelegationPropsType) => {
  const { navigation, route } = props;
  const { account, validators } = route.params;
  const { colors } = useTheme();

  const currency = getAccountCurrency(account);
  const color = getCurrencyColor(currency);
  const bridge = getAccountBridge(account);
  const mainAccount = getMainAccount(account, undefined);
  const unit = useMemo(() => getAccountUnit(account), [account]);

  /*
   * Find the validator that'll be picked by default, which is the one from Ledger.
   */

  const defaultValidator = useMemo(
    () => validators.find(validator => validator.contract === ELROND_LEDGER_VALIDATOR_ADDRESS),
    [validators],
  );

  /*
   * Instantiate the transaction when opening the flow. Only gets runned once.
   */

  const { transaction, updateTransaction, status, bridgeError } = useBridgeTransaction(() => ({
    account,
    transaction: bridge.updateTransaction(bridge.createTransaction(mainAccount), {
      amount: new BigNumber(0),
      recipient: defaultValidator ? defaultValidator.contract : "",
      mode: "delegate",
    }),
  }));

  /*
   * Use the transaction recipient to find the chosen validator and access more data about it..
   */

  const chosenValidator = useMemo(
    () =>
      validators.find(validator =>
        transaction ? transaction.recipient === validator.contract : false,
      ),
    [transaction, validators],
  );

  const chosenValidatorName = useMemo(
    () => (chosenValidator ? chosenValidator.identity.name || chosenValidator.contract : ""),
    [chosenValidator],
  );

  /*
   * Handle the possible errors of the transaction status and return the first one.
   */

  const { error } = useMemo(() => handleTransactionStatus(status), [status]);

  /*
   * Handle the rotation animation instantiation, and prepare the transform setting for the component.
   */

  const animation = useMemo(() => new Animated.Value(0), []);
  const transform = useMemo(
    () => [
      {
        rotate: animation.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "30deg"],
        }),
      },
    ],
    [animation],
  );

  /*
   * Call the animation based on the preset sequences and loop them with a one second delay.
   */

  const handleAnimation = useCallback(() => {
    const settings = [1, -1, 0];
    const sequence = settings.map((toValue, index) =>
      Animated.timing(animation, {
        toValue,
        duration: index % 2 === 0 ? 200 : 300,
        useNativeDriver: true,
      }),
    );

    Animated.loop(Animated.sequence(sequence.concat([Animated.delay(1000)]))).start();

    return () => {
      animation.setValue(0);
    };
  }, [animation]);

  /*
   * Callback function to be called when wanting to continue to the select device panel.
   */

  const onContinue = useCallback(() => {
    navigation.navigate(ScreenName.ElrondDelegationSelectDevice, {
      accountId: account.id,
      transaction,
      status,
      validators: validators,
      source: route.params.source,
    });
  }, [status, account, navigation, transaction, route.params.source, validators]);

  /*
   * Callback function to be called when wanting to change the transaction amount.
   */

  const onChangeAmount = useCallback(() => {
    if (transaction) {
      navigation.navigate(ScreenName.ElrondDelegationAmount, {
        account,
        validators,
        transaction,
        validatorName: chosenValidatorName,
      });
    }
  }, [transaction, account, validators, navigation, chosenValidatorName]);

  /*
   * Callback function to be called when wanting to change the validator.
   */

  const onChangeValidator = useCallback(() => {
    navigation.navigate(ScreenName.ElrondDelegationValidatorList, {
      account,
      validators,
      transaction,
    });
  }, [account, navigation, transaction, validators]);

  /*
   * Run the callback when there's a change in the transaction, received from the route parameters.
   */

  const trackTransactionUpdate = useCallback(() => {
    const returnedTransaction = route.params.transaction;

    if (returnedTransaction) {
      updateTransaction(() => returnedTransaction);
    }
  }, [route.params.transaction, updateTransaction]);

  /*
   * Parse the transaction amount as a denominated value.
   */

  const transactionAmount = useMemo(
    () =>
      denominate({
        input: String(transaction ? transaction.amount : 0),
        decimals: 4,
      }),
    [transaction],
  );

  /*
   * Handle the data for the two lines of text, showcasing the current transaction amount and recipient.
   */

  const summaries = useMemo(
    () => [
      {
        callback: onChangeAmount,
        i18nKey: "elrond.delegation.iDelegate",
        name: `${transactionAmount} ${unit.code}`,
      },
      {
        callback: onChangeValidator,
        i18nKey: "delegation.to",
        name: chosenValidator ? chosenValidator.identity.name || chosenValidator.contract : "",
      },
    ],
    [onChangeAmount, onChangeValidator, transactionAmount, chosenValidator, unit.code],
  );

  /*
   * Track all callback reference updates and run the effect conditionally.
   */

  useEffect(handleAnimation, [handleAnimation]);
  useEffect(trackTransactionUpdate, [trackTransactionUpdate]);

  /*
   * Return the rendered component.
   */

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="DelegationFlow"
        name="Summary"
        flow="stake"
        action="delegate"
        currency="egld"
      />

      <View style={styles.body}>
        <View style={styles.header}>
          <View style={styles.delegatingAccount}>
            <Circle size={64} bg={rgba(color, 0.2)}>
              <CurrencyIcon size={32} currency={currency} />
            </Circle>

            <View style={[styles.accountBalanceTag, { backgroundColor: colors.border }]}>
              <Text
                fontWeight="semiBold"
                numberOfLines={1}
                style={styles.accountBalanceTagText}
                color="smoke"
              >
                <CurrencyUnitValue showCode={true} unit={unit} value={account.balance} />
              </Text>
            </View>
          </View>

          <Image
            style={styles.delegationImage}
            source={require("../../../../../assets/delegation.png")}
          />

          <Touchable event="DelegationFlowSummaryChangeCircleBtn" onPress={onChangeValidator}>
            <Circle size={70} style={[styles.validatorCircle, { borderColor: colors.primary }]}>
              <Animated.View style={{ transform }}>
                <Circle crop size={64}>
                  {chosenValidator ? (
                    ELROND_LEDGER_VALIDATOR_ADDRESS === chosenValidator.contract ? (
                      <LedgerLogo size={64 * 0.7} color={colors.text} />
                    ) : (
                      <FirstLetterIcon
                        round={true}
                        size={64}
                        fontSize={24}
                        label={
                          chosenValidator
                            ? chosenValidator.identity.name || chosenValidator.contract
                            : "-"
                        }
                      />
                    )
                  ) : null}
                </Circle>
              </Animated.View>

              <Circle style={styles.changeDelegator} bg={colors.primary} size={26}>
                <Icon size={13} name="edit-2" />
              </Circle>
            </Circle>
          </Touchable>
        </View>
      </View>

      <View style={styles.summary}>
        {summaries.map(summary => (
          <View style={styles.summaryLine} key={summary.i18nKey}>
            <Text numberOfLines={1} fontWeight="semiBold" style={styles.summaryWords} color="smoke">
              <Trans i18nKey={summary.i18nKey} />
            </Text>

            <Touchable onPress={summary.callback}>
              <View
                style={[styles.validatorSelection, { backgroundColor: rgba(colors.primary, 0.2) }]}
              >
                <Text
                  fontWeight="bold"
                  numberOfLines={1}
                  style={styles.validatorSelectionText}
                  color={colors.primary}
                >
                  {summary.name}
                </Text>

                <View style={[styles.validatorSelectionIcon, { backgroundColor: colors.primary }]}>
                  <Icon size={16} name="edit-2" color={colors.text} />
                </View>
              </View>
            </Touchable>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Button
          event="SummaryContinue"
          type="primary"
          title={<Trans i18nKey="common.continue" />}
          containerStyle={styles.continueButton}
          onPress={onContinue}
          disabled={!!bridgeError || Boolean(error)}
        />
      </View>
    </SafeAreaView>
  );
};

export default SetDelegation;
