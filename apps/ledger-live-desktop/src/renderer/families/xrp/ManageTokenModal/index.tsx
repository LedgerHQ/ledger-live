import React from "react";
import { Trans } from "react-i18next";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { useDispatch } from "LLD/hooks/redux";
import { openModal } from "~/renderer/actions/modals";
import Box from "~/renderer/components/Box";
import Modal, { ModalBody } from "~/renderer/components/Modal";
import IconPen from "~/renderer/icons/Pen";
import IconTrash from "~/renderer/icons/Trash";
import * as S from "./ManageTokenModal.styles";

export type Data = {
  account: Account;
  tokenAccount: TokenAccount;
};

export default function ManageTokenModal() {
  const dispatch = useDispatch();

  return (
    <Modal
      name="MODAL_XRP_MANAGE_TOKEN"
      centered
      render={({ onClose, data }) => {
        const onSettings = () => {
          onClose();
          dispatch(openModal("MODAL_XRP_ADD_TOKEN", data));
        };

        const onRemove = () => {
          onClose();
          dispatch(openModal("MODAL_XRP_REMOVE_TOKEN", data));
        };

        return (
          <ModalBody
            onClose={onClose}
            title={<Trans i18nKey="xrp.manageToken.title" />}
            render={() => (
              <Box>
                <S.ManageButton data-testid="xrp-manage-token-settings" onClick={onSettings}>
                  <S.IconWrapper>
                    <IconPen size={16} />
                  </S.IconWrapper>
                  <S.InfoWrapper>
                    <S.Title>
                      <Trans i18nKey="xrp.manageToken.settings.title" />
                    </S.Title>
                    <S.Description>
                      <Trans i18nKey="xrp.manageToken.settings.description" />
                    </S.Description>
                  </S.InfoWrapper>
                </S.ManageButton>
                <S.ManageButton data-testid="xrp-manage-token-remove" onClick={onRemove}>
                  <S.IconWrapper>
                    <IconTrash size={16} />
                  </S.IconWrapper>
                  <S.InfoWrapper>
                    <S.Title>
                      <Trans i18nKey="xrp.removeToken.title" />
                    </S.Title>
                    <S.Description>
                      <Trans i18nKey="xrp.manageToken.remove.description" />
                    </S.Description>
                  </S.InfoWrapper>
                </S.ManageButton>
              </Box>
            )}
          />
        );
      }}
    />
  );
}
