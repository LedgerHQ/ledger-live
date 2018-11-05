/* @flow */
import React, { PureComponent, Fragment } from "react";
import { FlatList, View, StyleSheet, Keyboard } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import Icon from "react-native-vector-icons/dist/FontAwesome";
import type { Account } from "@ledgerhq/live-common/lib/types";
import { connect } from "react-redux";
import { translate } from "react-i18next";
import { BigNumber } from "bignumber.js";
import { getAccountBridge } from "../bridge";
import { updateAccount } from "../actions/accounts";
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
  updateAccount: Function,
  account: Account,
  t: T,
  transaction: *,
  navigation: NavigationScreenProp<*>,
};

type State = {
  fee: ?BigNumber,
  isModalOpened: boolean,
};

const mapDispatchToProps = {
  updateAccount,
};
class EditFeeUnit extends PureComponent<Props, State> {
  constructor({ account, transaction }) {
    super();
    const bridge = getAccountBridge(account);
    this.state = {
      fee: bridge.getTransactionExtra(account, transaction, "fee"),
      isModalOpened: false,
    };
  }

  onRequestClose = () => {
    this.setState({ isModalOpened: false });
  };
  onPress = () => {
    this.setState({ isModalOpened: true });
  };

  keyExtractor = (item: any) => item.code;
  onChange = (fee: ?BigNumber) => this.setState({ fee });
  updateAccount = (item: any) => {
    const { account, updateAccount } = this.props;
    const updatedAccount = {
      ...account,
      unit: item,
    };
    updateAccount(updatedAccount);
  };

  onValidateFees = () => {
    const { navigation, account } = this.props;
    const { fee } = this.state;
    const bridge = getAccountBridge(account);
    const transaction = navigation.getParam("transaction");
    Keyboard.dismiss();

    navigation.navigate("SendSummary", {
      accountId: account.id,
      transaction: bridge.editTransactionExtra(
        account,
        transaction,
        "fee",
        fee,
      ),
    });
  };

  render() {
    const { account, t } = this.props;
    const { isModalOpened, fee } = this.state;
    return (
      <Fragment>
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <CurrencyInput
              autoFocus
              unit={account.unit}
              value={fee}
              onChange={this.onChange}
            />
            <Touchable onPress={this.onPress} style={styles.unitContainer}>
              <View style={styles.unitSelectRow}>
                <LText secondary semiBold style={styles.unitStyle}>
                  {account.unit.code}
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
            renderItem={({ item }) => (
              <Touchable
                onPress={() => {
                  this.updateAccount(item);
                }}
              >
                <SettingsRow
                  title={item.code}
                  selected={account.unit.code === item.code}
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
export default connect(
  null,
  mapDispatchToProps,
)(translate()(EditFeeUnit));

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
