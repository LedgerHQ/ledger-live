// @flow

import React, { useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";
import styled, { css } from "styled-components";
import { Trans } from "react-i18next";
import { BigNumber } from "bignumber.js";

import { getMainAccount } from "@ledgerhq/live-common/account/index";

import type { SubAccount } from "@ledgerhq/types-live";

import { openModal } from "~/renderer/actions/modals";
import Box from "~/renderer/components/Box";
import Modal, { ModalBody } from "~/renderer/components/Modal";
import Freeze from "~/renderer/icons/Freeze";
import Vote from "~/renderer/icons/Vote";
import Unfreeze from "~/renderer/icons/Unfreeze";
import Text from "~/renderer/components/Text";
import { IconAccount } from "@ledgerhq/live-common/families/icon/types";
import Clock from "~/renderer/icons/Clock";
export type Props = {
  account: IconAccount | SubAccount;
  source?: string;
};
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
  ${p => (p.isPill ? `text-transform: uppercase;` : "")}
`;

const TimerWrapper = styled(Box).attrs(() => ({
  horizontal: true,
  alignItems: "center",
  ff: "Inter|Medium",
  fontSize: 3,
  color: "palette.text.shade50",
  bg: "palette.action.active",
  borderRadius: 4,
  p: 1,
  ml: 4,
}))`
  align-self: center;

  ${Description} {
    margin-left: 5px;
  }
`;

const ManageModal = ({ account, source, ...rest }: Props) => {
  console.log("account nef", account);
  const MIN_TRANSACTION_AMOUNT = 1;
  const dispatch = useDispatch();
  //const mainAccount = getMainAccount(account, parentAccount);
  //const { spendableBalance, iconResources } = mainAccount;
  const { spendableBalance, iconResources } = account;
  //invariant(iconResources, "icon account expected");

  const { votingPower, votes } = iconResources || {};

  const canFreeze =
    spendableBalance && spendableBalance.gte(MIN_TRANSACTION_AMOUNT) && !votingPower;
  const canUnfreeze = votingPower > 0;

  const canVote = votingPower > 0 || votes?.length > 0;

  const onSelectAction = useCallback(
    (name, onClose, params = {}) => {
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

  return (
    <Modal
      {...rest}
      name="MODAL_MANAGE_ICON"
      centered
      render={({ onClose }) => (
        <ModalBody
          onClose={onClose}
          onBack={undefined}
          title={<Trans i18nKey="icon.manage.title" />}
          noScroll
          render={() => (
            <>
              <Box>
                <ManageButton
                  disabled={!canFreeze}
                  onClick={() => onSelectAction("MODAL_ICON_FREEZE", onClose)}
                >
                  <IconWrapper>
                    <Freeze size={16} />
                  </IconWrapper>
                  <InfoWrapper>
                    <Title>
                      <Trans i18nKey="icon.manage.freeze.title" />
                    </Title>
                    <Description>
                      {!canVote ? (
                        <Trans i18nKey="icon.manage.freeze.description" />
                      ) : (
                        <Trans i18nKey="icon.manage.freeze.shouldUseVotingPowerFirst" />
                      )}
                    </Description>
                  </InfoWrapper>
                </ManageButton>
                <ManageButton
                  disabled={!canUnfreeze}
                  onClick={() => onSelectAction("MODAL_ICON_UNFREEZE", onClose)}
                >
                  <IconWrapper>
                    <Unfreeze size={16} />
                  </IconWrapper>
                  <InfoWrapper>
                    <Title>
                      <Trans i18nKey="icon.manage.unfreeze.title" />
                    </Title>
                    <Description>
                      <Trans i18nKey="icon.manage.unfreeze.description" />
                    </Description>
                  </InfoWrapper>
                  {!canUnfreeze && (
                    <TimerWrapper>
                      <Clock size={12} />
                      <Description isPill></Description>
                    </TimerWrapper>
                  )}
                </ManageButton>
                <ManageButton
                  disabled={!canVote}
                  onClick={() =>
                    onSelectAction(
                      votes && votes.length > 0 ? "MODAL_VOTE_ICON" : "MODAL_VOTE_ICON_INFO",
                      onClose,
                    )
                  }
                >
                  <IconWrapper>
                    <Vote size={16} />
                  </IconWrapper>
                  <InfoWrapper>
                    <Title>
                      <Trans i18nKey="icon.manage.vote.title" />
                    </Title>
                    <Description>
                      <Trans i18nKey="icon.manage.vote.description" />
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
