/* @flow */
import React, { PureComponent, Fragment } from "react";
import { FlatList, View, StyleSheet, Keyboard } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import Icon from "react-native-vector-icons/dist/FontAwesome";
import type { Account } from "@ledgerhq/live-common/lib/types";
import { translate } from "react-i18next";
import { BigNumber } from "bignumber.js";
import { getAccountBridge } from "../bridge";
import { getFieldByFamily, editTxFeeByFamily } from "./helpers";
import type { T } from "../types/common";
import SettingsRow from "../components/SettingsRow";
import LText from "../components/LText";
import CurrencyInput from "../components/CurrencyInput";
import Touchable from "../components/Touchable";
import BottomModal from "../components/BottomModal";
import Button from "../components/Button";
import colors from "../colors";
import CloseIcon from "../icons/Close";

type Props = {
  account: Account,
  t: T,
  navigation: NavigationScreenProp<*>,
  field: string,
};

type State = {
  fee: ?BigNumber,
  isModalOpened: boolean,
  isValid: boolean,
};

class EditFeeUnit extends PureComponent<Props, State> {
  constructor({ account, navigation, field }) {
    super();
    this.state = {
      fee: getFieldByFamily(account, navigation, field),
      isModalOpened: false,
      isValid: true,
    };
  }

  onRequestClose = () => {
    this.setState({ isModalOpened: false });
  };
  onPress = () => {
    this.setState({ isModalOpened: true });
  };

  keyExtractor = (item: any) => item.code;
  onChange = (fee: ?BigNumber) => {
    fee && fee.isZero()
      ? this.setState({ fee, isValid: false })
      : this.setState({ fee, isValid: true });
  };

  updateTransaction = (item: any) => {
    const { account, navigation } = this.props;
    const transaction = navigation.getParam("transaction");
    const bridge = getAccountBridge(account);
    navigation.setParams({
      transaction: bridge.editTransactionExtra(
        account,
        transaction,
        "feeCustomUnit",
        item,
      ),
    });
    this.onRequestClose();
  };

  onValidateFees = () => {
    const { navigation, account, field } = this.props;
    const { fee } = this.state;
    Keyboard.dismiss();

    navigation.navigate("SendSummary", {
      accountId: account.id,
      transaction: editTxFeeByFamily(account, navigation, field, fee),
    });
  };

  render() {
    const { account, t, navigation } = this.props;
    const { isModalOpened, fee, isValid } = this.state;
    const transaction = navigation.getParam("transaction");
    const bridge = getAccountBridge(account);
    const feeCustomUnit =
      bridge.getTransactionExtra(account, transaction, "feeCustomUnit") ||
      account.unit;
    return (
      <Fragment>
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <CurrencyInput
              style={{ flex: 1 }}
              autoFocus
              unit={feeCustomUnit}
              value={fee}
              onChange={this.onChange}
            />
            <Touchable onPress={this.onPress} style={styles.unitContainer}>
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
              type="primary"
              title={t("common.confirm")}
              containerStyle={styles.continueButton}
              onPress={this.onValidateFees}
              disabled={!isValid}
            />
          </View>
        </View>
        <BottomModal isOpened={isModalOpened} onClose={this.onRequestClose}>
          <View style={styles.editFeesUnitsModalTitleRow}>
            <LText secondary semiBold style={styles.editFeesUnitModalTitle}>
              {t("send.fees.edit.title")}
            </LText>
            <Touchable
              style={{ position: "absolute", top: 2, right: 16 }}
              onPress={this.onRequestClose}
            >
              <CloseIcon size={16} color={colors.grey} />
            </Touchable>
          </View>
          <FlatList
            data={account.currency.units}
            keyExtractor={this.keyExtractor}
            extraData={feeCustomUnit}
            renderItem={({ item }) => (
              <Touchable
                onPress={() => {
                  this.updateTransaction(item);
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
      </Fragment>
    );
  }
}
export default translate()(EditFeeUnit);

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
