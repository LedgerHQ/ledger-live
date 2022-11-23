import { BigNumber } from "bignumber.js";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import React, { useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  SafeAreaView,
} from "react-native";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import invariant from "invariant";
import { useTheme } from "@react-navigation/native";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  FIVE_MINUTES,
  TWO_WEEKS,
  YEAR,
  getReadableDate,
} from "@ledgerhq/live-common/families/avalanchepchain/utils";
import { accountScreenSelector } from "../../../reducers/accounts";
import { ScreenName } from "../../../const";
import { TrackScreen } from "../../../analytics";
import LText from "../../../components/LText";
import Button from "../../../components/Button";
import KeyboardView from "../../../components/KeyboardView";
import TranslatedError from "../../../components/TranslatedError";
import { getFirstStatusError } from "../../helpers";
import { localeSelector } from "../../../reducers/settings";
import type { StackNavigatorProps } from "../../../components/RootNavigator/types/helpers";
import { AvalancheDelegationFlowParamList } from "./types";

type Props = StackNavigatorProps<
  AvalancheDelegationFlowParamList,
  ScreenName.AvalancheDelegationEndDate
>;

export default function DelegationEndDate({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));
  const locale = useSelector(localeSelector);

  invariant(account?.type === "Account", "must be account");

  const bridge = getAccountBridge(account);

  const { transaction, setTransaction, status, bridgePending } =
    useBridgeTransaction(() => {
      return {
        account,
        transaction: {
          ...route.params.transaction,
          amount: new BigNumber(route.params.amount ?? 0),
          mode: "delegate",
        },
      };
    });

  invariant(transaction, "transaction must be defined");

  const onChange = (_, selectedDate: number) => {
    setTransaction(
      bridge.updateTransaction(transaction, {
        endTime: new BigNumber(selectedDate / 1000),
      }),
    );
  };

  const onContinue = () => {
    navigation.navigate(ScreenName.AvalancheDelegationValidator, {
      ...route.params,
      endTime: transaction.endTime,
    });
  };

  const blur = useCallback(() => Keyboard.dismiss(), []);

  const timeError = bridgePending ? null : status.errors.time;
  const warning = getFirstStatusError(status, "warnings");

  const stakeStartTime = Math.floor(Date.now() / 1000) + FIVE_MINUTES;
  const unixMinEndDate = stakeStartTime + TWO_WEEKS;
  const unixMaxEndDate = Math.min(
    stakeStartTime + YEAR,
    Number(route.params.validator.endTime),
  );

  const readableMinEndDate = getReadableDate(unixMinEndDate, locale);
  const readableMaxEndDate = getReadableDate(unixMaxEndDate, locale);

  return (
    <>
      <TrackScreen category="DelegationFlow" name="Amount" />
      <SafeAreaView
        style={[styles.root, { backgroundColor: colors.background }]}
      >
        <KeyboardView style={styles.container}>
          <TouchableWithoutFeedback onPress={blur}>
            <View style={[styles.root, { backgroundColor: colors.background }]}>
              <View style={styles.wrapper}>
                <View style={styles.datePickers}>
                  <DateTimePicker
                    mode="date"
                    value={new Date(transaction.endTime * 1000)}
                    onChange={onChange}
                    style={styles.datePicker}
                  />
                  <DateTimePicker
                    mode="time"
                    value={new Date(transaction.endTime * 1000)}
                    onChange={onChange}
                    style={styles.datePicker}
                  />
                </View>
                <LText semiBold style={styles.subText} color="grey">
                  <Trans
                    i18nKey={`avalanchepchain.delegation.flow.steps.endDate`}
                    values={{
                      minEndDate: readableMinEndDate,
                      maxEndDate: readableMaxEndDate,
                    }}
                  />
                </LText>
                <LText
                  style={[styles.fieldStatus]}
                  color={timeError ? "alert" : warning ? "orange" : "darkBlue"}
                  numberOfLines={2}
                >
                  <TranslatedError error={timeError || warning} />
                </LText>
              </View>
              <View style={styles.bottomWrapper}>
                <View style={styles.continueWrapper}>
                  <Button
                    event="AvalancheDelegateEndTimeContinue"
                    type="primary"
                    title={<Trans i18nKey={"common.continue"} />}
                    onPress={onContinue}
                    disabled={!!status.errors.time || bridgePending}
                  />
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  datePickers: {
    justifyContent: "space-evenly",
    flexDirection: "row",
    paddingBottom: 16,
  },
  datePicker: {
    width: "35%",
  },
  container: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
    alignItems: "stretch",
    justifyContent: "flex-start",
  },
  subText: {
    fontSize: 14,
    textAlign: "center",
    paddingBottom: 16,
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
  fieldStatus: {
    fontSize: 14,
    textAlign: "center",
  },
});
