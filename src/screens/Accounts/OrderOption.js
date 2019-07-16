/* @flow */

import React, { Component } from "react";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import { StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import { refreshAccountsOrdering } from "../../actions/general";
import { setOrderAccounts } from "../../actions/settings";
import { orderAccountsSelector } from "../../reducers/settings";
import Check from "../../icons/Check";
import LText from "../../components/LText";
import Touchable from "../../components/Touchable";
import colors from "../../colors";

const styles = StyleSheet.create({
  root: {
    borderRadius: 4,
    marginVertical: 4,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  rootSelected: {
    backgroundColor: "#f9f9f9",
  },
  label: {
    fontSize: 14,
    flex: 1,
  },
  order: {
    fontSize: 14,
    color: colors.grey,
    marginRight: 8,
  },
});

class OrderOption extends Component<{
  id: string,
  t: *,
  orderAccounts: string,
  setOrderAccounts: string => void,
  refreshAccountsOrdering: () => void,
}> {
  onPress = () => {
    const { id, setOrderAccounts, refreshAccountsOrdering } = this.props;
    setOrderAccounts(`${id}`);
    refreshAccountsOrdering();
  };

  render() {
    const { id, orderAccounts } = this.props;
    const selected = orderAccounts === id;
    return (
      <Touchable
        event="AccountOrderOption"
        eventProperties={{ accountOrderId: id }}
        style={[styles.root, selected && styles.rootSelected]}
        onPress={this.onPress}
      >
        <LText semiBold style={styles.label}>
          <Trans i18nKey={`orderOption.choices.${id}`} />
        </LText>
        {selected ? <Check color={colors.live} size={16} /> : null}
      </Touchable>
    );
  }
}

export default connect(
  createStructuredSelector({
    orderAccounts: orderAccountsSelector,
  }),
  {
    setOrderAccounts,
    refreshAccountsOrdering,
  },
)(OrderOption);
