// @flow

import React, { PureComponent } from "react";
import { withNavigation } from "react-navigation";
import Icon from "react-native-vector-icons/dist/Feather";
import AddAccountsModal from "../../components/AddAccountsModal";
import Touchable from "../../components/Touchable";
import colors from "../../colors";

class AddAccount extends PureComponent<
  { navigation: * },
  { isAddModalOpened: boolean },
> {
  state = {
    isAddModalOpened: false,
  };

  closeAddModal = () => {
    this.setState({ isAddModalOpened: false });
  };

  openAddModal = () => {
    this.setState({ isAddModalOpened: true });
  };

  render() {
    const { navigation } = this.props;
    const { isAddModalOpened } = this.state;
    return (
      <>
        <Touchable style={{ marginHorizontal: 16 }} onPress={this.openAddModal}>
          <Icon name="plus" color={colors.grey} size={20} />
        </Touchable>

        <AddAccountsModal
          navigation={navigation}
          isOpened={isAddModalOpened}
          onClose={this.closeAddModal}
        />
      </>
    );
  }
}

export default withNavigation(AddAccount);
