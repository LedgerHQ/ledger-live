import { Trans } from "react-i18next";
import styled from "styled-components";
import { BigNumber } from "bignumber.js";
import React, { memo, useMemo } from "react";
import { Account } from "@ledgerhq/types-live";
import {
  isDefaultValidatorGroup,
  voteStatus,
  fallbackValidatorGroup,
} from "@ledgerhq/live-common/families/celo/logic";
import { CeloVote } from "@ledgerhq/coin-evm/types/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useCeloPreloadData } from "@ledgerhq/live-common/families/celo/react";
import { IconContainer } from "~/renderer/components/Delegation/ValidatorRow";
import FirstLetterIcon from "~/renderer/components/FirstLetterIcon";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import CheckCircle from "~/renderer/icons/CheckCircle";
import Discreet from "~/renderer/components/Discreet";
import Tooltip from "~/renderer/components/Tooltip";
import Box from "~/renderer/components/Box/Box";
import Loader from "~/renderer/icons/Loader";
import Logo from "~/renderer/icons/Logo";

const TableLine = styled(Box).attrs(() => ({
  ff: "Inter|SemiBold",
  color: "palette.text.shade60",
  horizontal: true,
  alignItems: "center",
  justifyContent: "flex-start",
  fontSize: 3,
  flex: 1.125,
  pr: 2,
}))`
  box-sizing: border-box;
  &:last-child {
    justify-content: flex-end;
    flex: 0.5;
    text-align: right;
    white-space: nowrap;
  }
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 16px 20px;
`;
const Column = styled(TableLine).attrs<{ strong?: boolean; clickable?: boolean }>(p => ({
  ff: "Inter|SemiBold",
  color: p.strong ? "palette.text.shade100" : "palette.text.shade80",
  fontSize: 3,
}))<{ strong?: boolean; clickable?: boolean }>`
  cursor: ${p => (p.clickable ? "pointer" : "cursor")};
  ${IconContainer} {
    color: ${p => p.theme.colors.palette.text.shade80};
    opacity: 1;
  }
  ${p =>
    p.clickable
      ? `
    &:hover {
      color: ${p.theme.colors.palette.primary.main};
    }
    `
      : ``}
`;
const Ellipsis = styled.div`
  flex: 1;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

type Props = {
  account: Account;
  vote: CeloVote;
  onExternalLink: (vote: CeloVote) => void;
};

const Row = ({ account, vote, onExternalLink }: Props) => {
  const onExternalLinkClick = () => onExternalLink(vote);

  const unit = useAccountUnit(account);

  const { validatorGroups } = useCeloPreloadData();
  const validatorGroup = useMemo(
    () =>
      validatorGroups.find(v => v.address === vote.validatorGroup) ||
      fallbackValidatorGroup(vote.validatorGroup),
    [vote, validatorGroups],
  );
  const status = voteStatus(vote);
  const formatAmount = (amount: number) => {
    return formatCurrencyUnit(unit, new BigNumber(amount), {
      disableRounding: false,
      alwaysShowSign: false,
      showCode: true,
    });
  };
  return (
    <Wrapper>
      <Column strong clickable onClick={onExternalLinkClick}>
        <Box mr={1}>
          <IconContainer isSR>
            {isDefaultValidatorGroup(validatorGroup) ? (
              <Logo size={16} />
            ) : (
              <FirstLetterIcon label={validatorGroup.name} />
            )}
          </IconContainer>
        </Box>
        <Ellipsis>{validatorGroup.name}</Ellipsis>
      </Column>
      <Column>
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
      </Column>
      <Column>
        <Discreet>{formatAmount(vote.amount.toNumber() ?? 0)}</Discreet>
      </Column>
      <Column></Column>
    </Wrapper>
  );
};

export default memo(Row);
