import { Icons, Text } from "@ledgerhq/native-ui";
import React, { FC, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";
import styled from "styled-components/native";
import AddAccountDrawer from "LLM/features/Accounts/screens/AddAccount";
import { track } from "~/analytics";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import {
  ModularDrawerLocation,
  useModularDrawerController,
  useModularDrawerVisibility,
} from "~/newArch/features/ModularDrawer";

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

const AddAccountButton: FC<Props> = ({ sourceScreenName, disabled, currency, onClick }) => {
  const { t } = useTranslation();

  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState<boolean>(false);

  const { openDrawer } = useModularDrawerController();
  const { isModularDrawerVisible } = useModularDrawerVisibility({
    modularDrawerFeatureFlagKey: "llmModularDrawer",
  });

  const handleOnclick = useCallback(() => {
    if (isModularDrawerVisible(ModularDrawerLocation.ADD_ACCOUNT)) {
      handleCloseAddAccountModal();
      return openDrawer();
    } else {
      return onClick?.();
    }
  }, [isModularDrawerVisible, onClick, openDrawer]);

  const handleOpenAddAccountModal = () => {
    track("button_clicked", { button: "Add a new account", page: sourceScreenName, currency });
    if (onClick) {
      handleOnclick();

      return;
    }
    setIsAddAccountModalOpen(true);
  };

  const handleCloseAddAccountModal = () => setIsAddAccountModalOpen(false);

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
      <AddAccountDrawer isOpened={isAddAccountModalOpen} onClose={handleCloseAddAccountModal} />
    </>
  );
};

export default AddAccountButton;
