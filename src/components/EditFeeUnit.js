/* @flow */
import React, { useState } from "react";
import { FlatList, View, StyleSheet, Keyboard } from "react-native";
import { useNavigation, useRoute, useTheme } from "@react-navigation/native";
import Icon from "react-native-vector-icons/dist/FontAwesome";
import type { Account } from "@ledgerhq/live-common/lib/types";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import { useTranslation } from "react-i18next";
import { BigNumber } from "bignumber.js";
import { ScreenName } from "../const";
import { useFieldByFamily, useEditTxFeeByFamily } from "../families/helpers";
import SettingsRow from "./SettingsRow";
import LText from "./LText";
import CurrencyInput from "./CurrencyInput";
import Touchable from "./Touchable";
import BottomModal from "./BottomModal";
import Button from "./Button";
import CloseIcon from "../icons/Close";

type Props = {
  account: Account,
  field: string,
};

export default function EditFreeUnit({ account, field }: Props) {
  const { colors } = useTheme();
  const { navigate } = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const fieldByFamily = useFieldByFamily(field);

  const [fee, setFee] = useState<BigNumber | null | typeof undefined>(
    fieldByFamily,
  );
  const [isModalOpened, setIsModalOpened] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [transaction, setTransaction] = useState(route.params?.transaction);

  const feeCustomUnit = transaction.feeCustomUnit || account.unit;
  const editTxFeeByFamily = useEditTxFeeByFamily();

  function onRequestClose() {
    setIsModalOpened(false);
  }

  function onPress() {
    setIsModalOpened(true);
  }

  function keyExtractor(item: any): string {
    return item.code;
  }

  function onChange(fee: ?BigNumber) {
    setFee(fee);
    setIsValid(!(fee && fee.isZero()));
  }

  function updateTransaction(feeCustomUnit: any) {
    const bridge = getAccountBridge(account);
    setTransaction(bridge.updateTransaction(transaction, { feeCustomUnit }));
    onRequestClose();
  }

  function onValidateFees() {
    Keyboard.dismiss();

    navigate(ScreenName.SendSummary, {
      accountId: account.id,
      transaction: editTxFeeByFamily({ account, field, fee }),
    });
  }

  return (
    <>
      <View style={styles.inputContainer}>
        <View style={styles.inputRow}>
          <CurrencyInput
            style={{ flex: 1 }}
            autoFocus
            unit={feeCustomUnit}
            value={fee}
            onChange={onChange}
          />
          <Touchable
            event="EditFeeUnitOpen"
            onPress={onPress}
            style={styles.unitContainer}
          >
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
      <BottomModal
        id="EditFeeUnitModal"
        isOpened={isModalOpened}
        onClose={onRequestClose}
      >
        <View style={styles.editFeesUnitsModalTitleRow}>
          <LText secondary semiBold style={styles.editFeesUnitModalTitle}>
            {t("send.fees.edit.title")}
          </LText>
          <Touchable
            event="EditFeeUnitClose"
            style={{ position: "absolute", top: 2, right: 16 }}
            onPress={onRequestClose}
          >
            <CloseIcon size={16} color={colors.grey} />
          </Touchable>
        </View>
        <FlatList
          data={account.currency.units}
          keyExtractor={keyExtractor}
          extraData={feeCustomUnit}
          renderItem={({ item }) => (
            <Touchable
              event="EditFeeUnit"
              eventProperties={{ unit: item.code }}
              onPress={() => {
                updateTransaction(item);
              }}
            >
              <SettingsRow
                title={item.code}
                selected={feeCustomUnit === item}
              />
            </Touchable>
          )}
        >
          {account.unit.code}
        </FlatList>
      </BottomModal>
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
