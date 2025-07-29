import { Icons, Text } from "@ledgerhq/native-ui";
import React, { FC, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";
import styled from "styled-components/native";
import AddAccountDrawer from "LLM/features/Accounts/screens/AddAccount";
import { track } from "~/analytics";
import {
  ModularDrawerLocation,
  useModularDrawerStore,
  useModularDrawerVisibility,
} from "LLM/features/ModularDrawer";
import { listAndFilterCurrencies } from "@ledgerhq/live-common/platform/helpers";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { findCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";

const StyledPressable = styled(Pressable)`
  border-width: 1px;
  border-style: dotted;
  border-color: ${({ theme }) => theme.colors.opacityDefault.c10};
  padding: 16px;
  margin-vertical: 8px;
  border-radius: 12px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  column-gap: 12px;
`;

type Props = {
  sourceScreenName: string;
  onClick?: () => void;
  disabled?: boolean;
  currency?: CryptoOrTokenCurrency | string;
};

const currencies = listAndFilterCurrencies({ includeTokens: true });

const AddAccountButton: FC<Props> = ({ sourceScreenName, disabled, currency, onClick }) => {
  const { t } = useTranslation();

  const cryptoCurrency = useMemo(() => {
    if (!currency) return undefined;
    if (typeof currency === "string") return findCryptoCurrencyById(currency) || undefined;
    return currency;
  }, [currency]);

  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState<boolean>(false);

  const handleOpenAddAccountModal = () => {
    track("button_clicked", { button: "Add a new account", page: sourceScreenName, currency });
    if (onClick) {
      if (isModularDrawerVisible(ModularDrawerLocation.ADD_ACCOUNT)) {
        handleOpenModularDrawer();
      } else {
        onClick();
      }

      return;
    }
    setIsAddAccountModalOpen(true);
  };

  const handleCloseAddAccountModal = () => setIsAddAccountModalOpen(false);

  const { openDrawer } = useModularDrawerStore();
  const { isModularDrawerVisible } = useModularDrawerVisibility({
    modularDrawerFeatureFlagKey: "llmModularDrawer",
  });

  const handleOpenModularDrawer = useCallback(() => {
    if (isModularDrawerVisible(ModularDrawerLocation.ADD_ACCOUNT)) {
      handleCloseAddAccountModal();
      const currenciesToUse = cryptoCurrency ? [cryptoCurrency] : currencies;
      return openDrawer({ currencies: currenciesToUse, enableAccountSelection: false });
    } else {
      return onClick?.();
    }
  }, [isModularDrawerVisible, onClick, openDrawer, cryptoCurrency]);

  return (
    <>
      <StyledPressable
        disabled={disabled}
        style={({ pressed }: { pressed: boolean }) => [
          { opacity: pressed ? 0.5 : 1.0, marginVertical: 12 },
          disabled && { opacity: 0.5 },
        ]}
        hitSlop={6}
        onPress={handleOpenAddAccountModal}
        testID="add-new-account-button"
      >
        <Text variant="large">{t("addAccounts.addNewOrExisting")}</Text>
        <Icons.Plus size="S" color="neutral.c100" />
      </StyledPressable>
      <AddAccountDrawer
        isOpened={isAddAccountModalOpen}
        onClose={handleCloseAddAccountModal}
        onShowModularDrawer={handleOpenModularDrawer}
      />
    </>
  );
};

export default AddAccountButton;
