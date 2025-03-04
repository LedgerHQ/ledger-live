import React, { useCallback } from "react";
import { useDispatch } from "react-redux";
import { Trans, useTranslation } from "react-i18next";
import { openModal } from "~/renderer/actions/modals";
import Box from "~/renderer/components/Box";
import Modal, { ModalBody } from "~/renderer/components/Modal";
import BondIcon from "~/renderer/icons/LinkIcon";
import UnbondIcon from "~/renderer/icons/Undelegate";
import NominateIcon from "~/renderer/icons/Vote";
import RevokeIcon from "~/renderer/icons/VoteNay";
import ClaimRewardIcon from "~/renderer/icons/ClaimReward";
import * as S from "./ManageModal.styles";
import { CosmosAccount } from "@ledgerhq/live-common/families/cosmos/types";
import { ModalData } from "~/renderer/modals/types";
import { TokenAccount } from "@ledgerhq/types-live";

export type Props = {
//   account: CeloAccount;
  account: CosmosAccount | TokenAccount;
    uiConfig: any;
  source?: string;
};

const ManageModal = ({ account, uiConfig, source, ...rest }: Props) => {
  const { t } = useTranslation();
//   const { celoResources } = account;
//   invariant(celoResources, "celo account expected");
  const dispatch = useDispatch();
  const onSelectAction = useCallback(
    (onClose: () => void, name: keyof ModalData, params = {}) => {
      onClose();
      dispatch(
        openModal(name, {
          account,
          source,
          ...params,
        }),
      );
    },
    [dispatch, account, source],
  );
  const groupsVotedFor = [];//...new Set(celoResources.votes?.map(v => v.validatorGroup))];
  const canVoteForNewGroup = false;// celoResources.maxNumGroupsVotedFor.gt(groupsVotedFor.length);
  const unlockingEnabled = false; //celoResources.nonvotingLockedBalance?.gt(0);
  const votingEnabled = false; // celoResources.nonvotingLockedBalance?.gt(0) && canVoteForNewGroup;
  const withdrawEnabled = false;// availablePendingWithdrawals(account).length;
  const activatingEnabled = false; //activatableVotes(account).length;
  const revokingEnabled = false; //revokableVotes(account).length;

  const canDelegate = 'delegate' in uiConfig;
  return (
    <Modal
      {...rest}
      name="MODAL_COSMOS_MANAGE"
      centered
      render={({ onClose }) => (
        <ModalBody
          onClose={onClose}
          onBack={undefined}
          title={<Trans i18nKey="celo.manage.title" />}
          render={() => (
            <>
              <Box>
                <S.ManageButton
                  onClick={() => {
                      onSelectAction(onClose, "MODAL_CELO_SIMPLE_OPERATION", {
                        mode: "register",
                      });
                  }}
                >
                  <S.IconWrapper>
                    <BondIcon size={16} />
                  </S.IconWrapper>
                  <S.InfoWrapper>
                    <S.Title>
                      <Trans i18nKey="Lock" />
                    </S.Title>
                    <S.Description>
                      <Trans i18nKey="celo.manage.lock.description" />
                    </S.Description>
                  </S.InfoWrapper>
                </S.ManageButton>
                                
                <S.ManageButton
                  disabled={!canDelegate}
                  onClick={() => {
                      onSelectAction(onClose, "MODAL_COMMON_DELEGATE", {
                        mode: "register",
                      });
                  }}
                >
                  <S.IconWrapper>
                    <BondIcon size={16} />
                  </S.IconWrapper>
                  <S.InfoWrapper>
                    <S.Title>
                        Delegate
                    </S.Title>
                    <S.Description>
                        Delegate your coins to a validator
                    </S.Description>
                  </S.InfoWrapper>
                </S.ManageButton>
                                

                <S.ManageButton
                  data-testid="celo-vote-button"
                  disabled={!votingEnabled}
                  onClick={() => onSelectAction(onClose, "MODAL_CELO_VOTE")}
                >
                  <S.IconWrapper>
                    <NominateIcon size={16} />
                  </S.IconWrapper>
                  <S.InfoWrapper>
                    <S.Title>
                      <Trans i18nKey="celo.manage.vote.title" />
                    </S.Title>
                    <S.Description>
                      {canVoteForNewGroup ? (
                        <Trans i18nKey="celo.manage.vote.description" />
                      ) : (
                        <>
                          {t("celo.manage.vote.descriptionMaxVotes", {
                            maxVotes: 4,//celoResources.maxNumGroupsVotedFor.toString(),
                          })}
                        </>
                      )}
                    </S.Description>
                  </S.InfoWrapper>
                </S.ManageButton>
                <S.ManageButton
                  data-testid="celo-activate-vote-button"
                  disabled={!activatingEnabled}
                  onClick={() => onSelectAction(onClose, "MODAL_CELO_ACTIVATE")}
                >
                  <S.IconWrapper>
                    <NominateIcon size={16} />
                  </S.IconWrapper>
                  <S.InfoWrapper>
                    <S.Title>
                      <Trans i18nKey="celo.manage.activate.title" />
                    </S.Title>
                    <S.Description>
                      <Trans i18nKey="celo.manage.activate.description" />
                    </S.Description>
                  </S.InfoWrapper>
                </S.ManageButton>
                <S.ManageButton
                  data-testid="celo-revoke-vote-button"
                  disabled={!revokingEnabled}
                  onClick={() => onSelectAction(onClose, "MODAL_CELO_REVOKE")}
                >
                  <S.IconWrapper>
                    <RevokeIcon size={16} />
                  </S.IconWrapper>
                  <S.InfoWrapper>
                    <S.Title>
                      <Trans i18nKey="celo.manage.revoke.title" />
                    </S.Title>
                    <S.Description>
                      <Trans i18nKey="celo.manage.revoke.description" />
                    </S.Description>
                  </S.InfoWrapper>
                </S.ManageButton>
                <S.ManageButton
                  data-testid="celo-unlock-button"
                  disabled={!unlockingEnabled}
                  onClick={() => onSelectAction(onClose, "MODAL_CELO_UNLOCK")}
                >
                  <S.IconWrapper>
                    <UnbondIcon size={16} />
                  </S.IconWrapper>
                  <S.InfoWrapper>
                    <S.Title>
                      <Trans i18nKey="Unlock" />
                    </S.Title>
                    <S.Description>
                      <Trans i18nKey="celo.manage.unlock.description" />
                    </S.Description>
                  </S.InfoWrapper>
                </S.ManageButton>
                <S.ManageButton
                  data-testid="celo-withdraw-button"
                  disabled={!withdrawEnabled}
                  onClick={() =>
                    onSelectAction(onClose, "MODAL_CELO_WITHDRAW", {
                      mode: "withdraw",
                    })
                  }
                >
                  <S.IconWrapper>
                    <ClaimRewardIcon size={16} />
                  </S.IconWrapper>
                  <S.InfoWrapper>
                    <S.Title>
                      <Trans i18nKey="celo.manage.withdraw.title" />
                    </S.Title>
                    <S.Description>
                      <Trans i18nKey="celo.manage.withdraw.description" />
                    </S.Description>
                  </S.InfoWrapper>
                </S.ManageButton>
              </Box>
            </>
          )}
          renderFooter={undefined}
        />
      )}
    />
  );
};
export default ManageModal;

