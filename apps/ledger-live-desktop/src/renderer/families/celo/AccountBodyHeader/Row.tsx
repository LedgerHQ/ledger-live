import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import React, { useCallback, useMemo } from "react";
import { Trans } from "react-i18next";
import Box from "~/renderer/components/Box/Box";
import FirstLetterIcon from "~/renderer/components/FirstLetterIcon";
import CheckCircle from "~/renderer/icons/CheckCircle";
import Loader from "~/renderer/icons/Loader";
import { CeloVote } from "@ledgerhq/live-common/families/celo/types";
import { useCeloPreloadData } from "@ledgerhq/live-common/families/celo/react";
import {
  isDefaultValidatorGroup,
  voteStatus,
  fallbackValidatorGroup,
} from "@ledgerhq/live-common/families/celo/logic";
import Logo from "~/renderer/icons/Logo";
import { IconContainer } from "~/renderer/components/Delegation/ValidatorRow";
import Tooltip from "~/renderer/components/Tooltip";
import IconInfoCircle from "~/renderer/icons/InfoCircle";
import * as S from "./Row.styles";
import ManageDropDown from "./ManageDropDown";
import { ModalActions } from "../modals";
import { DropDownItemType } from "~/renderer/components/DropDownSelector";
const voteActions = (vote: CeloVote): Array<{ key: ModalActions; label: React.ReactNode }> => {
  const actions: Array<{ key: ModalActions; label: React.ReactNode }> = [];
  if (vote.activatable)
    actions.push({
      key: "MODAL_CELO_ACTIVATE",
      label: <Trans i18nKey="celo.delegation.actions.activate" />,
    });
  if (vote.revokable)
    actions.push({
      key: "MODAL_CELO_REVOKE",
      label: <Trans i18nKey="celo.delegation.actions.revoke" />,
    });
  return actions;
};
type Props = {
  account: Account;
  vote: CeloVote;
  onManageAction: (vote: CeloVote, action: ModalActions) => void;
  onExternalLink: (vote: CeloVote) => void;
};
export const Row = ({ account, vote, onManageAction, onExternalLink }: Props) => {
  const onSelect = useCallback(
    (action: DropDownItemType) => {
      onManageAction(vote, action?.key as ModalActions);
    },
    [onManageAction, vote],
  );
  const onExternalLinkClick = () => onExternalLink(vote);
  const actions = voteActions(vote);
  const { validatorGroups } = useCeloPreloadData();
  const validatorGroup = useMemo(
    () =>
      validatorGroups.find(v => v.address === vote.validatorGroup) ||
      fallbackValidatorGroup(vote.validatorGroup),
    [vote, validatorGroups],
  );
  const status = voteStatus(vote);
  const formatAmount = (amount: number) => {
    const unit = getAccountUnit(account);
    return formatCurrencyUnit(unit, new BigNumber(amount), {
      disableRounding: false,
      alwaysShowSign: false,
      showCode: true,
    });
  };
  return (
    <S.Wrapper>
      <S.Column strong clickable onClick={onExternalLinkClick}>
        <Box mr={1}>
          <IconContainer isSR>
            {isDefaultValidatorGroup(validatorGroup) ? (
              <Logo size={16} />
            ) : (
              <FirstLetterIcon label={validatorGroup.name} />
            )}
          </IconContainer>
        </Box>
        <S.Ellipsis>{validatorGroup.name}</S.Ellipsis>
      </S.Column>
      <S.Column>
        {status === "active" && (
          <Box color="positiveGreen">
            <Tooltip content={<Trans i18nKey="celo.delegation.activeTooltip" />}>
              <CheckCircle size={14} />
            </Tooltip>
          </Box>
        )}
        {status === "awaitingActivation" && (
          <Box color="orange">
            <Tooltip content={<Trans i18nKey="celo.delegation.awaitingActivationTooltip" />}>
              <Loader size={14} />
            </Tooltip>
          </Box>
        )}
        {status === "pending" && (
          <Box color="grey">
            <Tooltip content={<Trans i18nKey="celo.delegation.pendingTooltip" />}>
              <Loader size={14} />
            </Tooltip>
          </Box>
        )}
        <Box ml={1}>
          <Trans i18nKey={`celo.revoke.steps.vote.${status}`} />
        </Box>
      </S.Column>
      <S.Column>{formatAmount(vote.amount.toNumber() ?? 0)}</S.Column>
      <S.Column>
        {actions.length > 0 && <ManageDropDown actions={actions} onSelect={onSelect} />}
        {actions.length === 0 && (
          <S.ManageInfoIconWrapper>
            <Tooltip content={<Trans i18nKey={"celo.delegation.manageMultipleVoteWarning"} />}>
              <IconInfoCircle />
            </Tooltip>
          </S.ManageInfoIconWrapper>
        )}
      </S.Column>
    </S.Wrapper>
  );
};
