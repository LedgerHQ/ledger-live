import React, { memo, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { Flex } from "@ledgerhq/native-ui";
import { PlusMedium } from "@ledgerhq/native-ui/assets/icons";
import Touchable from "../../components/Touchable";
import AddAccountsModal from "../AddAccounts/AddAccountsModal";

function AddAccount() {
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
      onPress={openAddModal}
      testID="OpenAddAccountModal"
    >
      <Flex
        bg={"neutral.c100"}
        width={"32px"}
        height={"32px"}
        alignItems={"center"}
        justifyContent={"center"}
        borderRadius={32}
      >
        <PlusMedium size={20} color={"neutral.c00"} />
      </Flex>
      <AddAccountsModal
        navigation={navigation}
        isOpened={isAddModalOpened}
        onClose={closeAddModal}
      />
    </Touchable>
  );
}

export default memo(AddAccount);
