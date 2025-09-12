import React, { memo, useState, useEffect } from "react";
import { Flex } from "@ledgerhq/native-ui";
import { PlusMedium } from "@ledgerhq/native-ui/assets/icons";
import { findCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { getCryptoAssetsStore } from "@ledgerhq/live-common/bridge/crypto-assets/index";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import Touchable from "~/components/Touchable";
import { track } from "~/analytics";
import AddAccountDrawer from "LLM/features/Accounts/screens/AddAccount";

function AddAccount({ currencyId }: { currencyId?: string }) {
  const [currency, setCurrency] = useState<CryptoCurrency | TokenCurrency | null | undefined>(
    undefined,
  );
  const [isAddModalOpened, setIsAddModalOpened] = useState(false);

  useEffect(() => {
    async function loadCurrency() {
      if (currencyId) {
        try {
          const cryptoCurrency = findCryptoCurrencyById(currencyId);
          if (cryptoCurrency) {
            setCurrency(cryptoCurrency);
          } else {
            const tokenCurrency = await getCryptoAssetsStore().findTokenById(currencyId);
            setCurrency(tokenCurrency || null);
          }
        } catch (error) {
          console.error("Failed to load currency:", error);
          setCurrency(null);
        }
      } else {
        setCurrency(undefined);
      }
    }
    loadCurrency();
  }, [currencyId]);

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
