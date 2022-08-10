// @flow

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
import invariant from "invariant";
import {
  availablePendingWithdrawals,
  activatableVotes,
  revokableVotes,
} from "@ledgerhq/live-common/families/celo/logic";
import * as S from "./ManageModal.styles";
import type { Account } from "@ledgerhq/types-live";

type Props = {
  name?: string,
  account: Account,
  ...
};

const ManageModal = ({ name, account, ...rest }: Props) => {
  const { t } = useTranslation();
  const { celoResources } = account;

  invariant(celoResources, "celo account expected");

  const dispatch = useDispatch();

  const onSelectAction = useCallback(
    (onClose, name, params = {}) => {
      onClose();
      dispatch(
        openModal(name, {
          account,
          ...params,
        }),
      );
    },
    [dispatch, account],
  );
  const groupsVotedFor = [...new Set(celoResources.votes.map(v => v.validatorGroup))];
  const canVoteForNewGroup = celoResources.maxNumGroupsVotedFor.gt(groupsVotedFor.length);
  const unlockingEnabled = celoResources.nonvotingLockedBalance?.gt(0);
  const votingEnabled = celoResources.nonvotingLockedBalance?.gt(0) && canVoteForNewGroup;
  const withdrawEnabled = availablePendingWithdrawals(account).length;
  const activatingEnabled = activatableVotes(account).length;
  const revokingEnabled = revokableVotes(account).length;

  return (
    <Modal
      {...rest}
      name={name}
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
                    if (account.celoResources?.registrationStatus) {
                      onSelectAction(onClose, "MODAL_CELO_LOCK");
                    } else {
                      onSelectAction(onClose, "MODAL_CELO_SIMPLE_OPERATION", {
                        mode: "register",
                      });
                    }
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
                            maxVotes: celoResources.maxNumGroupsVotedFor.toString(),
                          })}
                        </>
                      )}
                    </S.Description>
                  </S.InfoWrapper>
                </S.ManageButton>
                <S.ManageButton
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
