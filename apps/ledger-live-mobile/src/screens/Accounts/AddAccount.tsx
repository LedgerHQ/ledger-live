import React, { memo, useState } from "react";
import { Flex } from "@ledgerhq/native-ui";
import { PlusMedium } from "@ledgerhq/native-ui/assets/icons";
import Touchable from "~/components/Touchable";
import { track } from "~/analytics";
import AddAccountDrawer from "LLM/features/Accounts/screens/AddAccount";
import { cryptoAssetsHooks } from "~/config/bridge-setup";

function AddAccount({ currencyId }: { currencyId?: string }) {
  const { currency } = cryptoAssetsHooks.useCurrencyById(currencyId || "");
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
    <>
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
      </Touchable>
      <AddAccountDrawer isOpened={isAddModalOpened} onClose={closeAddModal} currency={currency} />
    </>
  );
}

export default memo(AddAccount);
