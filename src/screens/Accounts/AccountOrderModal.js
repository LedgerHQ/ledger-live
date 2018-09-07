/* @flow */

import React, { Component } from "react";
import { withNavigation } from "react-navigation";
import MenuTitle from "../../components/MenuTitle";
import OrderOption from "./OrderOption";
import BottomModal from "../../components/BottomModal";

class AccountOrderModal extends Component<{
  navigation: *,
  isOpened: boolean,
  onClose: () => void,
}> {
  render() {
    const { onClose, isOpened } = this.props;
    return (
      <BottomModal onClose={onClose} isOpened={isOpened}>
        <MenuTitle>Sort by</MenuTitle>
        <OrderOption id="balance" />
        <OrderOption id="name" />
      </BottomModal>
    );
  }
}

export default withNavigation(AccountOrderModal);
