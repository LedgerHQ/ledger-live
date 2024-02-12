import React, { memo, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { Flex } from "@ledgerhq/native-ui";
import { PlusMedium } from "@ledgerhq/native-ui/assets/icons";
import { findCryptoCurrencyById, findTokenById } from "@ledgerhq/live-common/currencies/index";
import Touchable from "~/components/Touchable";
import AddAccountsModal from "../AddAccounts/AddAccountsModal";
import { track } from "~/analytics";
import { BaseNavigation } from "~/components/RootNavigator/types/helpers";

function AddAccount({ currencyId }: { currencyId?: string }) {
  const navigation = useNavigation<BaseNavigation>();
  const currency = currencyId
    ? findCryptoCurrencyById(currencyId) || findTokenById(currencyId)
    : undefined;
  const [isAddModalOpened, setIsAddModalOpened] = useState(false);

  function openAddModal() {
    track("button_clicked", {
      button: "Add Account",
    });
    setIsAddModalOpened(true);
  }

  function closeAddModal() {
    setIsAddModalOpened(false);
  }

  return (
    <Touchable event="OpenAddAccountModal" onPress={openAddModal} testID="OpenAddAccountModal">
      <Flex
        bg={"neutral.c100"}
        width={"32px"}
        height={"32px"}
        alignItems={"center"}
        justifyContent={"center"}
        borderRadius={32}
        testID="add-account-button"
      >
        <PlusMedium size={20} color={"neutral.c00"} />
      </Flex>
      <AddAccountsModal
        navigation={navigation}
        isOpened={isAddModalOpened}
        onClose={closeAddModal}
        currency={currency}
      />
    </Touchable>
  );
}

export default memo(AddAccount);
