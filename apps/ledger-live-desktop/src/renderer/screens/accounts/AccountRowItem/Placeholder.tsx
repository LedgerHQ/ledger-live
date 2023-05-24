import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import { openModal } from "~/renderer/actions/modals";
import Box from "~/renderer/components/Box";
import IconPlus from "~/renderer/icons/Plus";

const AddAccountButton = styled(Box)`
  border: 1px dashed rgba(153, 153, 153, 0.3);
  cursor: pointer;
  border-radius: 4px;
  padding: 20px;
  color: #abadb6;
  font-weight: 600;
  align-items: center;
  justify-content: center;
  display: flex;
  flex-direction: row;
  height: auto;

  &:hover {
    cursor: pointer;
    border-color: ${p => p.theme.colors.palette.text.shade100};
    color: ${p => p.theme.colors.palette.text.shade100};
  }
`;
const Placeholder = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const openAddAccounts = useCallback(() => {
    dispatch(openModal("MODAL_ADD_ACCOUNTS", undefined));
  }, [dispatch]);
  return (
    <Box mb={5}>
      <AddAccountButton onClick={openAddAccounts} pb={6}>
        <IconPlus size={16} />
        <Box ml={20} ff="Inter|Regular" fontSize={4}>
          {t("addAccounts.cta.add")}
        </Box>
      </AddAccountButton>
    </Box>
  );
};
export default React.memo<{}>(Placeholder);
