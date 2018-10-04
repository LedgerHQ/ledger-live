/* @flow */

import React, { Component, Fragment } from "react";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import { StyleSheet } from "react-native";
import { translate } from "react-i18next";
import Icon from "react-native-vector-icons/dist/Feather";
import { refreshAccountsOrdering } from "../../actions/general";
import { setOrderAccounts } from "../../actions/settings";
import { orderAccountsSelector } from "../../reducers/settings";
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
    const {
      id,
      orderAccounts,
      setOrderAccounts,
      refreshAccountsOrdering,
    } = this.props;
    const selected = orderAccounts.startsWith(id);
    let isDesc = orderAccounts.endsWith("|desc");
    if (selected) {
      isDesc = !isDesc;
    }
    setOrderAccounts(`${id}|${isDesc ? "desc" : "asc"}`);
    refreshAccountsOrdering();
  };

  render() {
    const { id, orderAccounts, t } = this.props;
    const selected = orderAccounts.startsWith(id);
    const isDesc = orderAccounts.endsWith("|desc");
    return (
      <Touchable
        style={[styles.root, selected && styles.rootSelected]}
        onPress={this.onPress}
      >
        <LText semiBold style={styles.label}>
          {t(`orderOption.label.${id}`)}
        </LText>
        {selected ? (
          <Fragment>
            <LText semiBold style={styles.order}>
              {t(`orderOption.ordering.${isDesc ? "desc" : "asc"}`)}
            </LText>
            <Icon
              name={isDesc ? "arrow-down" : "arrow-up"}
              color={colors.live}
              size={16}
            />
          </Fragment>
        ) : null}
      </Touchable>
    );
  }
}

export default translate()(
  connect(
    createStructuredSelector({
      orderAccounts: orderAccountsSelector,
    }),
    {
      setOrderAccounts,
      refreshAccountsOrdering,
    },
  )(OrderOption),
);
