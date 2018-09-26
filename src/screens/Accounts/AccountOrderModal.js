/* @flow */

import React, { Component } from "react";
import { View } from "react-native";
import { translate } from "react-i18next";

import { withNavigation } from "react-navigation";
import type { T } from "../../types/common";

import MenuTitle from "../../components/MenuTitle";
import OrderOption from "./OrderOption";
import BottomModal from "../../components/BottomModal";
import BlueButton from "../../components/BlueButton";

class AccountOrderModal extends Component<{
  navigation: *,
  isOpened: boolean,
  onClose: () => void,
  t: T,
}> {
  render() {
    const { onClose, isOpened, t } = this.props;
    return (
      <BottomModal onClose={onClose} isOpened={isOpened}>
        <MenuTitle>{t("common.common.sortBy")}</MenuTitle>
        <OrderOption id="balance" />
        <OrderOption id="name" />
        <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
          <BlueButton
            onPress={onClose}
            title="Done"
            containerStyle={{ height: 48 }}
          />
        </View>
      </BottomModal>
    );
  }
}

export default translate()(withNavigation(AccountOrderModal));
