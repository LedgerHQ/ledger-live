import React, { memo, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { Flex } from "@ledgerhq/native-ui";
import { PlusMedium } from "@ledgerhq/native-ui/assets/icons";
import { findCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import Touchable from "../../components/Touchable";
import AddAccountsModal from "../AddAccounts/AddAccountsModal";
import { useCurrentRouteName } from "../../helpers/routeHooks";
import { track } from "../../analytics";

function AddAccount({ currencyId }: { currencyId?: string }) {
  const navigation = useNavigation();
  const currentScreen = useCurrentRouteName();
  const currency = currencyId ? findCryptoCurrencyById(currencyId) : undefined;
  const [isAddModalOpened, setIsAddModalOpened] = useState(false);

  function openAddModal() {
    track("button_clicked", {
      button: "Add Account",
      screen: currentScreen,
    });
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
        currency={currency}
      />
    </Touchable>
  );
}

export default memo(AddAccount);
