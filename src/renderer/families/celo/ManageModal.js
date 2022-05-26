// @flow

import React, { useCallback } from "react";
import { useDispatch } from "react-redux";
import styled, { css } from "styled-components";
import { Trans } from "react-i18next";
import type { Account } from "@ledgerhq/live-common/lib/types";

import { openModal } from "~/renderer/actions/modals";
import Box from "~/renderer/components/Box";
import Modal, { ModalBody } from "~/renderer/components/Modal";

import BondIcon from "~/renderer/icons/LinkIcon";
import UnbondIcon from "~/renderer/icons/Undelegate";
import NominateIcon from "~/renderer/icons/Vote";
import WithdrawUnbondedIcon from "~/renderer/icons/Coins";

import Text from "~/renderer/components/Text";
import invariant from "invariant";

import {
  availablePendingWithdrawals,
  activatableVotes,
  revokableVotes,
} from "@ledgerhq/live-common/lib/families/celo/logic";

const IconWrapper = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 32px;
  background-color: ${p => p.theme.colors.palette.action.hover};
  color: ${p => p.theme.colors.palette.primary.main};
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: ${p => p.theme.space[2]}px;
`;

const ManageButton = styled.button`
  min-height: 88px;
  padding: 16px;
  margin: 5px 0;
  border-radius: 4px;
  border: 1px solid ${p => p.theme.colors.palette.divider};
  background-color: rgba(0, 0, 0, 0);
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: flex-start;

  &:hover {
    border: 1px solid ${p => p.theme.colors.palette.primary.main};
  }

  ${p =>
    p.disabled
      ? css`
          pointer-events: none;
          cursor: auto;
          ${IconWrapper} {
            background-color: ${p.theme.colors.palette.action.active};
            color: ${p.theme.colors.palette.text.shade20};
          }
          ${Title} {
            color: ${p.theme.colors.palette.text.shade50};
          }
          ${Description} {
            color: ${p.theme.colors.palette.text.shade30};
          }
        `
      : `
      cursor: pointer;
  `};
`;

const InfoWrapper = styled(Box).attrs(() => ({
  vertical: true,
  flex: 1,
  ml: 3,
  textAlign: "start",
}))``;

const Title = styled(Text).attrs(() => ({
  ff: "Inter|SemiBold",
  fontSize: 4,
}))``;

const Description = styled(Text).attrs(({ isPill }) => ({
  ff: isPill ? "Inter|SemiBold" : "Inter|Regular",
  fontSize: isPill ? 2 : 3,
  color: "palette.text.shade60",
}))`
  ${p =>
    p.isPill
      ? `
    text-transform: uppercase;
  `
      : ""}
`;

type Props = {
  name?: string,
  account: Account,
  ...
};

const ManageModal = ({ name, account, ...rest }: Props) => {
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

  const unlockingEnabled = celoResources.nonvotingLockedBalance?.gt(0);
  const votingEnabled = celoResources.nonvotingLockedBalance?.gt(0);
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
          title={<Trans i18nKey="polkadot.manage.title" />}
          noScroll
          render={() => (
            <>
              <Box>
                <ManageButton
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
                  <IconWrapper>
                    <BondIcon size={16} />
                  </IconWrapper>
                  <InfoWrapper>
                    <Title>
                      <Trans i18nKey="Lock" />
                    </Title>
                    <Description>
                      <Trans i18nKey="celo.manage.lock.description" />
                    </Description>
                  </InfoWrapper>
                </ManageButton>
                <ManageButton
                  disabled={!votingEnabled}
                  onClick={() => onSelectAction(onClose, "MODAL_CELO_VOTE")}
                >
                  <IconWrapper>
                    <NominateIcon size={16} />
                  </IconWrapper>
                  <InfoWrapper>
                    <Title>
                      <Trans i18nKey="celo.manage.vote.title" />
                    </Title>
                    <Description>
                      <Trans i18nKey="celo.manage.vote.description" />
                    </Description>
                  </InfoWrapper>
                </ManageButton>
                <ManageButton
                  disabled={!activatingEnabled}
                  onClick={() => onSelectAction(onClose, "MODAL_CELO_ACTIVATE")}
                >
                  <IconWrapper>
                    <NominateIcon size={16} />
                  </IconWrapper>
                  <InfoWrapper>
                    <Title>
                      <Trans i18nKey="celo.manage.activate.title" />
                    </Title>
                    <Description>
                      <Trans i18nKey="celo.manage.activate.description" />
                    </Description>
                  </InfoWrapper>
                </ManageButton>
                <ManageButton
                  disabled={!revokingEnabled}
                  onClick={() => onSelectAction(onClose, "MODAL_CELO_REVOKE")}
                >
                  <IconWrapper>
                    <NominateIcon size={16} />
                  </IconWrapper>
                  <InfoWrapper>
                    <Title>
                      <Trans i18nKey="celo.manage.revoke.title" />
                    </Title>
                    <Description>
                      <Trans i18nKey="celo.manage.revoke.description" />
                    </Description>
                  </InfoWrapper>
                </ManageButton>
                <ManageButton
                  disabled={!unlockingEnabled}
                  onClick={() => onSelectAction(onClose, "MODAL_CELO_UNLOCK")}
                >
                  <IconWrapper>
                    <UnbondIcon size={16} />
                  </IconWrapper>
                  <InfoWrapper>
                    <Title>
                      <Trans i18nKey="Unlock" />
                    </Title>
                    <Description>
                      <Trans i18nKey="celo.manage.unlock.description" />
                    </Description>
                  </InfoWrapper>
                </ManageButton>
                <ManageButton
                  disabled={!withdrawEnabled}
                  onClick={() =>
                    onSelectAction(onClose, "MODAL_CELO_WITHDRAW", {
                      mode: "withdraw",
                    })
                  }
                >
                  <IconWrapper>
                    <WithdrawUnbondedIcon size={16} />
                  </IconWrapper>
                  <InfoWrapper>
                    <Title>
                      <Trans i18nKey="celo.manage.withdraw.title" />
                    </Title>
                    <Description>
                      <Trans i18nKey="celo.manage.withdraw.description" />
                    </Description>
                  </InfoWrapper>
                </ManageButton>
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
