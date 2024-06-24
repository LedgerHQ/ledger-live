import React, { memo, useState } from "react";
import { Flex } from "@ledgerhq/native-ui";
import { PlusMedium } from "@ledgerhq/native-ui/assets/icons";
import { findCryptoCurrencyById, findTokenById } from "@ledgerhq/live-common/currencies/index";
import Touchable from "~/components/Touchable";
import { track } from "~/analytics";
import AddAccountDrawer from "LLM/features/Accounts/screens/AddAccount";

function AddAccount({ currencyId }: { currencyId?: string }) {
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

  function reopenAddModal() {
    setIsAddModalOpened(true);
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
      <AddAccountDrawer
        isOpened={isAddModalOpened}
        onClose={closeAddModal}
        reopenDrawer={reopenAddModal}
        currency={currency}
      />
    </>
  );
}

export default memo(AddAccount);
