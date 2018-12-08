// @flow

import React, { PureComponent } from "react";
import { withNavigation } from "react-navigation";
import Icon from "react-native-vector-icons/dist/Feather";
import Touchable from "../../components/Touchable";
import colors from "../../colors";
import AddAccountsModal from "../AddAccounts/AddAccountsModal";

class AddAccount extends PureComponent<
  { navigation: * },
  { isAddModalOpened: boolean },
> {
  state = {
    isAddModalOpened: false,
  };

  onPress = () => {
    this.props.navigation.navigate("ImportAccounts");
  };

  openAddModal = () => this.setState({ isAddModalOpened: true });

  closeAddModal = () => this.setState({ isAddModalOpened: false });

  render() {
    const { navigation } = this.props;
    const { isAddModalOpened } = this.state;
    return (
      <Touchable
        event="OpenAddAccountModal"
        style={{ marginHorizontal: 16 }}
        onPress={this.openAddModal}
      >
        <Icon name="plus" color={colors.grey} size={20} />
        <AddAccountsModal
          navigation={navigation}
          isOpened={isAddModalOpened}
          onClose={this.closeAddModal}
        />
      </Touchable>
    );
  }
}

export default withNavigation(AddAccount);
