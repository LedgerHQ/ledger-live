import React, { useState } from "react";
import { FlatList, View, StyleSheet, Keyboard } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Icon from "react-native-vector-icons/FontAwesome";
import type { Account } from "@ledgerhq/types-live";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { useTranslation } from "react-i18next";
import { BigNumber } from "bignumber.js";
import { Unit } from "@ledgerhq/types-cryptoassets";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { ScreenName } from "~/const";
import { useFieldByFamily, useEditTxFeeByFamily } from "~/families/helpers";
import SettingsRow from "./SettingsRow";
import LText from "./LText";
import CurrencyInput from "./CurrencyInput";
import Touchable from "./Touchable";
import QueuedDrawer from "./QueuedDrawer";
import Button from "./Button";
import { BaseComposite, StackNavigatorProps } from "./RootNavigator/types/helpers";
import { SendFundsNavigatorStackParamList } from "./RootNavigator/types/SendFundsNavigator";

type Props = {
  account: Account;
  field: string;
};

type Navigation = BaseComposite<
  StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.SendSummary>
>;

export default function EditFreeUnit({ account, field }: Props) {
  const { navigate } = useNavigation<Navigation["navigation"]>();
  const route = useRoute<Navigation["route"]>();
  const { t } = useTranslation();
  const fieldByFamily = useFieldByFamily(field);
  const [fee, setFee] = useState<BigNumber | null>(() => {
    if (fieldByFamily && fieldByFamily instanceof BigNumber) {
      return fieldByFamily;
    }
    return null;
  });
  const [isModalOpened, setIsModalOpened] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [transaction, setTransaction] = useState<Transaction>(
    (route.params as { transaction: Transaction })?.transaction,
  );
  const feeCustomUnit = (transaction as { feeCustomUnit?: Unit }).feeCustomUnit || account.unit;
  const editTxFeeByFamily = useEditTxFeeByFamily();

  function onRequestClose() {
    setIsModalOpened(false);
  }

  function onPress() {
    setIsModalOpened(true);
  }

  function keyExtractor(item: Unit): string {
    return item.code;
  }

  function onChange(fee: BigNumber | null) {
    setFee(fee);
    setIsValid(!(fee && fee.isZero()));
  }

  function updateTransaction(feeCustomUnit: Unit) {
    const bridge = getAccountBridge(account);
    setTransaction(
      bridge.updateTransaction(transaction, {
        feeCustomUnit,
      }),
    );
    onRequestClose();
  }

  function onValidateFees() {
    Keyboard.dismiss();
    navigate(ScreenName.SendSummary, {
      ...route.params,
      accountId: account.id,
      parentId: undefined,
      transaction: editTxFeeByFamily({
        account,
        field,
        fee,
      }),
    });
  }

  return (
    <>
      <View style={styles.inputContainer}>
        <View style={styles.inputRow}>
          <CurrencyInput
            style={{
              flex: 1,
            }}
            autoFocus
            unit={feeCustomUnit}
            value={fee}
            onChange={onChange}
          />
          <Touchable event="EditFeeUnitOpen" onPress={onPress} style={styles.unitContainer}>
            <View style={styles.unitSelectRow}>
              <LText secondary semiBold style={styles.unitStyle}>
                {feeCustomUnit.code}
              </LText>
              <View style={styles.arrowDown}>
                <Icon name="angle-down" size={12} />
              </View>
            </View>
          </Touchable>
        </View>
        <View style={styles.buttonContainer}>
          <Button
            event="EditFeeUnitConfirm"
            type="primary"
            title={t("common.confirm")}
            containerStyle={styles.continueButton}
            onPress={onValidateFees}
            disabled={!isValid}
          />
        </View>
      </View>
      <QueuedDrawer isRequestingToBeOpened={isModalOpened} onClose={onRequestClose}>
        <View style={styles.editFeesUnitsModalTitleRow}>
          <LText secondary semiBold style={styles.editFeesUnitModalTitle}>
            {t("send.fees.edit.title")}
          </LText>
        </View>
        <FlatList
          data={account.currency.units}
          keyExtractor={keyExtractor}
          extraData={feeCustomUnit}
          renderItem={({ item }) => (
            <Touchable
              event="EditFeeUnit"
              eventProperties={{
                unit: item.code,
              }}
              onPress={() => {
                updateTransaction(item);
              }}
            >
              <SettingsRow title={item.code} selected={feeCustomUnit === item} />
            </Touchable>
          )}
        >
          {account.unit.code}
        </FlatList>
      </QueuedDrawer>
    </>
  );
}
const styles = StyleSheet.create({
  buttonContainer: {
    flex: 1,
    padding: 16,
    justifyContent: "flex-end",
  },
  continueButton: {
    alignSelf: "stretch",
  },
  inputContainer: {
    flex: 1,
    padding: 16,
  },
  inputRow: {
    flexDirection: "row",
  },
  unitContainer: {
    justifyContent: "center",
  },
  unitStyle: {
    marginRight: 8,
  },
  unitSelectRow: {
    flexDirection: "row",
  },
  arrowDown: {
    justifyContent: "center",
  },
  editFeesUnitModalTitle: {
    fontSize: 16,
  },
  editFeesUnitsModalTitleRow: {
    flexDirection: "row",
    marginTop: 16,
    justifyContent: "center",
  },
});
