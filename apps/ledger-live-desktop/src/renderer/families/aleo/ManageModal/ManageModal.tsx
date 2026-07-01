import React, { useCallback } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { Trans } from "react-i18next";
import { openModal } from "~/renderer/actions/modals";
import Box from "~/renderer/components/Box";
import Modal, { ModalBody } from "~/renderer/components/Modal";
import IconCoins from "~/renderer/icons/Coins";
import UnbondIcon from "~/renderer/icons/Undelegate";
import ClaimRewardIcon from "~/renderer/icons/ClaimReward";
import { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { Account } from "@ledgerhq/types-live";
import { ModalData } from "~/renderer/modals/types";
import * as S from "./ManageModal.styles";

export type Data = {
  account: AleoAccount;
  parentAccount?: Account;
  source?: string;
};

// TODO(LIVE-29195): gate Unstake (bonded>0) and Claim (matured unbond) when staking balances land.
const ManageModal = ({ account, parentAccount, source, ...rest }: Data) => {
  const dispatch = useDispatch();
  const onSelectAction = useCallback(
    (onClose: () => void, name: keyof ModalData) => {
      onClose();
      dispatch(openModal(name, { account, parentAccount, source }));
    },
    [dispatch, account, parentAccount, source],
  );
  return (
    <Modal
      {...rest}
      name="MODAL_ALEO_MANAGE"
      centered
      render={({ onClose }) => (
        <ModalBody
          onClose={onClose}
          onBack={undefined}
          title={<Trans i18nKey="aleo.manage.title" />}
          render={() => (
            <Box>
              <S.ManageButton
                data-testid="aleo-stake-button"
                onClick={() => onSelectAction(onClose, "MODAL_ALEO_BOND_PUBLIC")}
              >
                <S.IconWrapper>
                  <IconCoins size={16} />
                </S.IconWrapper>
                <S.InfoWrapper>
                  <S.Title>
                    <Trans i18nKey="aleo.manage.stake.title" />
                  </S.Title>
                  <S.Description>
                    <Trans i18nKey="aleo.manage.stake.description" />
                  </S.Description>
                </S.InfoWrapper>
              </S.ManageButton>
              <S.ManageButton
                data-testid="aleo-unstake-button"
                onClick={() => onSelectAction(onClose, "MODAL_ALEO_UNBOND")}
              >
                <S.IconWrapper>
                  <UnbondIcon size={16} />
                </S.IconWrapper>
                <S.InfoWrapper>
                  <S.Title>
                    <Trans i18nKey="aleo.manage.unstake.title" />
                  </S.Title>
                  <S.Description>
                    <Trans i18nKey="aleo.manage.unstake.description" />
                  </S.Description>
                </S.InfoWrapper>
              </S.ManageButton>
              <S.ManageButton
                data-testid="aleo-claim-button"
                onClick={() => onSelectAction(onClose, "MODAL_ALEO_CLAIM_UNBOND")}
              >
                <S.IconWrapper>
                  <ClaimRewardIcon size={16} />
                </S.IconWrapper>
                <S.InfoWrapper>
                  <S.Title>
                    <Trans i18nKey="aleo.manage.claim.title" />
                  </S.Title>
                  <S.Description>
                    <Trans i18nKey="aleo.manage.claim.description" />
                  </S.Description>
                </S.InfoWrapper>
              </S.ManageButton>
            </Box>
          )}
          renderFooter={undefined}
        />
      )}
    />
  );
};

export default ManageModal;
