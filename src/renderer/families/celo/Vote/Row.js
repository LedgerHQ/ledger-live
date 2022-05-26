// @flow
import { getAccountUnit } from "@ledgerhq/live-common/lib/account";
import { formatCurrencyUnit } from "@ledgerhq/live-common/lib/currencies";
import type { Account } from "@ledgerhq/live-common/lib/types";
import { BigNumber } from "bignumber.js";
import React, { useCallback, useMemo } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import Box from "~/renderer/components/Box/Box";
import DropDown, { DropDownItem } from "~/renderer/components/DropDownSelector";
import FirstLetterIcon from "~/renderer/components/FirstLetterIcon";
import Text from "~/renderer/components/Text";
import ToolTip from "~/renderer/components/Tooltip";
import CheckCircle from "~/renderer/icons/CheckCircle";
import ChevronRight from "~/renderer/icons/ChevronRight";
import Loader from "~/renderer/icons/Loader";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";
import { TableLine } from "./Header";
import { CeloVote } from "@ledgerhq/live-common/lib/families/celo/types";
import { useCeloPreloadData } from "@ledgerhq/live-common/lib/families/celo/react";
import { isDefaultValidatorGroup, voteStatus } from "@ledgerhq/live-common/lib/families/celo/logic";
import Logo from "~/renderer/icons/Logo";
import { IconContainer } from "~/renderer/components/Delegation/ValidatorRow";

const Wrapper: ThemedComponent<*> = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 16px 20px;
`;

const Column: ThemedComponent<{ clickable?: boolean }> = styled(TableLine).attrs(p => ({
  ff: "Inter|SemiBold",
  color: p.strong ? "palette.text.shade100" : "palette.text.shade80",
  fontSize: 3,
}))`
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

const Ellipsis: ThemedComponent<{}> = styled.div`
  flex: 1;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ManageDropDownItem = ({
  item,
  isActive,
}: {
  item: { key: string, label: string, disabled: boolean, tooltip: React$Node },
  isActive: boolean,
}) => {
  return (
    <>
      <ToolTip content={item.tooltip} containerStyle={{ width: "100%" }}>
        <DropDownItem disabled={item.disabled} isActive={isActive}>
          <Box horizontal alignItems="center" justifyContent="center">
            <Text ff="Inter|SemiBold">{item.label}</Text>
          </Box>
        </DropDownItem>
      </ToolTip>
    </>
  );
};

type Props = {
  account: Account,
  vote: CeloVote,
  onManageAction: (vote: CeloVote, action: string) => void,
  onExternalLink: (address: string) => void,
};

export function Row({ account, vote, onManageAction, onExternalLink }: Props) {
  const onSelect = useCallback(
    action => {
      onManageAction(vote, action.key);
    },
    [onManageAction],
  );

  const onExternalLinkClick = () => onExternalLink(vote);

  const actions = voteActions(vote);

  const { validatorGroups } = useCeloPreloadData();
  const validatorGroup = useMemo(
    () => validatorGroups.find(v => v.address === vote.validatorGroup),
    [vote, validatorGroups],
  );
  const status = voteStatus(vote);

  const formatAmount = (amount: number) => {
    const unit = getAccountUnit(account);
    return formatCurrencyUnit(unit, new BigNumber(amount), {
      disableRounding: true,
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
            <ToolTip content={<Trans i18nKey="celo.delegation.activeTooltip" />}>
              <CheckCircle size={14} />
            </ToolTip>
          </Box>
        )}
        {status === "awaitingActivation" && (
          <Box color="orange">
            <ToolTip content={<Trans i18nKey="celo.delegation.awaitingActivationTooltip" />}>
              <Loader size={14} />
            </ToolTip>
          </Box>
        )}
        {status === "pending" && (
          <Box color="grey">
            <ToolTip content={<Trans i18nKey="celo.delegation.pendingTooltip" />}>
              <Loader size={14} />
            </ToolTip>
          </Box>
        )}
        <Box ml={1}>
          <Trans i18nKey={`celo.revoke.steps.vote.${status}`} />
        </Box>
      </Column>
      <Column>{formatAmount(vote.amount ?? 0)}</Column>
      <Column>
        {actions.length > 0 && (
          <DropDown items={actions} renderItem={ManageDropDownItem} onChange={onSelect}>
            {({ isOpen, value }) => {
              return (
                <Box flex horizontal alignItems="center">
                  <Trans i18nKey="common.manage" />
                  <div style={{ transform: "rotate(90deg)" }}>
                    <ChevronRight size={16} />
                  </div>
                </Box>
              );
            }}
          </DropDown>
        )}
      </Column>
    </Wrapper>
  );
}

function voteActions(vote) {
  const actions = [];

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
}
