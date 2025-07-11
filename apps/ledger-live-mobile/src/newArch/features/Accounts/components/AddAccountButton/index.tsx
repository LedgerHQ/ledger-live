import { Icons, Text } from "@ledgerhq/native-ui";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";
import styled from "styled-components/native";
import AddAccountDrawer from "LLM/features/Accounts/screens/AddAccount";
import { track } from "~/analytics";

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
  currency?: string;
};

const AddAccountButton: React.FC<Props> = ({ sourceScreenName, disabled, currency, onClick }) => {
  const { t } = useTranslation();
  const [isAddModalOpened, setAddModalOpened] = useState<boolean>(false);

  const openAddModal = () => {
    track("button_clicked", { button: "Add a new account", page: sourceScreenName, currency });
    if (onClick) {
      onClick();
      return;
    }
    setAddModalOpened(true);
  };
  const closeAddModal = () => setAddModalOpened(false);

  return (
    <>
      <StyledPressable
        disabled={disabled}
        style={({ pressed }: { pressed: boolean }) => [
          { opacity: pressed ? 0.5 : 1.0, marginVertical: 12 },
          disabled && { opacity: 0.5 },
        ]}
        hitSlop={6}
        onPress={openAddModal}
        testID="add-new-account-button"
      >
        <Text variant="large">{t("addAccounts.addNewOrExisting")}</Text>
        <Icons.Plus size="S" color="neutral.c100" />
      </StyledPressable>
      <AddAccountDrawer isOpened={isAddModalOpened} onClose={closeAddModal} />
    </>
  );
};

export default AddAccountButton;
