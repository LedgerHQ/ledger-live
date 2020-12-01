// @flow

import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/dist/Feather";
import Touchable from "../../components/Touchable";
import colors from "../../colors";
import AddAccountsModal from "../AddAccounts/AddAccountsModal";

export default function AddAccount() {
  const navigation = useNavigation();

  const [isAddModalOpened, setIsAddModalOpened] = useState(false);

  function openAddModal() {
    setIsAddModalOpened(true);
  }

  function closeAddModal() {
    setIsAddModalOpened(false);
  }

  return (
    <Touchable
      event="OpenAddAccountModal"
      style={{ marginHorizontal: 16 }}
      onPress={openAddModal}
    >
      <Icon name="plus" color={colors.grey} size={20} />
      <AddAccountsModal
        navigation={navigation}
        isOpened={isAddModalOpened}
        onClose={closeAddModal}
      />
    </Touchable>
  );
}
