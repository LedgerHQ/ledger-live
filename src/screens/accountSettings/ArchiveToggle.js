/* @flow */
import React, { Component } from "react";
import { Switch } from "react-native";
import { connect } from "react-redux";
import { accountByIdSelector } from "../../reducers/accounts";
import { updateAccount } from "../../actions/accounts";

const mapStateToProps = (state, { accountId }) => ({
  account: accountByIdSelector(state, accountId)
});

const mapDispatchToProps = {
  updateAccount
};

class ArchiveToggle extends Component<*> {
  onValueChange = (value: boolean) => {
    const { account, updateAccount } = this.props;
    updateAccount({ archived: value, id: account.id });
  };
  render() {
    const { account } = this.props;
    return (
      <Switch value={account.archived} onValueChange={this.onValueChange} />
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ArchiveToggle);
