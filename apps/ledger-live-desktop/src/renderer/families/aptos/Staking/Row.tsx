import React, { useCallback } from "react";
import styled from "styled-components";
import { Trans } from "react-i18next";
import { AptosMappedStakingPosition } from "@ledgerhq/live-common/families/aptos/types";
import { canUnstake, canWithdraw, canRestake } from "@ledgerhq/live-common/families/aptos/staking";
import { TableLine } from "./Header";
import DropDown, { DropDownItem, DropDownItemType } from "~/renderer/components/DropDownSelector";
import Box from "~/renderer/components/Box/Box";
import ChevronRight from "~/renderer/icons/ChevronRight";
import CheckCircle from "~/renderer/icons/CheckCircle";
import ExclamationCircleThin from "~/renderer/icons/ExclamationCircleThin";
import ToolTip from "~/renderer/components/Tooltip";
import ValidatorIcon from "~/renderer/families/aptos/shared/components/ValidatorIcon";
import Text from "~/renderer/components/Text";
import Discreet from "~/renderer/components/Discreet";

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 16px 20px;
`;

const Column = styled(TableLine).attrs<{
  clickable?: boolean;
  strong?: boolean;
}>(p => ({
  ff: "Inter|SemiBold",
  color: p.strong ? "neutral.c100" : "neutral.c80",
  fontSize: 3,
}))<{
  clickable?: boolean;
  strong?: boolean;
}>`
  cursor: ${p => (p.clickable ? "pointer" : "cursor")};
  ${p =>
    p.clickable
      ? `
    &:hover {
      color: ${p.theme.colors.primary.c80};
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

const ManageDropDownItem = ({
  item,
  isActive,
}: {
  item: DropDownItemType<React.JSX.Element>;
  isActive: boolean;
}) => {
  return (
    <ToolTip
      content={item.content}
      containerStyle={{
        width: "100%",
      }}
    >
      <DropDownItem disabled={item.disabled} isActive={isActive}>
        <Box horizontal alignItems="center" justifyContent="center">
          <Text ff="Inter|SemiBold">{item.label}</Text>
        </Box>
      </DropDownItem>
    </ToolTip>
  );
};

type Props = {
  stakingPosition: AptosMappedStakingPosition;
  onManageAction: (
    address: string,
    action: "MODAL_APTOS_UNSTAKE" | "MODAL_APTOS_WITHDRAW" | "MODAL_APTOS_RESTAKE",
  ) => void;
  onExternalLink: (address: string) => void;
};

export function Row({
  stakingPosition: {
    validatorId,
    active,
    pendingInactive,
    formattedAmount,
    formattedPending,
    formattedAvailable,
    validator,
  },
  stakingPosition,
  onManageAction,
  onExternalLink,
}: Readonly<Props>) {
  const unstakingEnabled = canUnstake(stakingPosition);
  const withdrawingEnabled = canWithdraw(stakingPosition);
  const restakingEnabled = canRestake(stakingPosition);

  const onSelect = useCallback(
    (action: (typeof dropDownItems)[number]) => {
      onManageAction(
        validatorId,
        action.key as "MODAL_APTOS_UNSTAKE" | "MODAL_APTOS_WITHDRAW" | "MODAL_APTOS_RESTAKE",
      );
    },
    [onManageAction, validatorId],
  );

  const dropDownItems = [
    unstakingEnabled && {
      key: "MODAL_APTOS_UNSTAKE",
      label: <Trans i18nKey="aptos.stake.unstake" />,
    },
    withdrawingEnabled && {
      key: "MODAL_APTOS_WITHDRAW",
      label: <Trans i18nKey="aptos.stake.withdraw" />,
    },
    restakingEnabled && {
      key: "MODAL_APTOS_RESTAKE",
      label: <Trans i18nKey="aptos.stake.restake" />,
    },
  ].filter(Boolean) as DropDownItemType<React.JSX.Element>[];

  const onExternalLinkClick = useCallback(
    () => onExternalLink(validatorId),
    [onExternalLink, validatorId],
  );

  return (
    <Wrapper>
      <Column strong clickable onClick={onExternalLinkClick}>
        <Box mr={2}>
          <ValidatorIcon validatorAddress={validator?.address} />
        </Box>
        <Ellipsis>{validatorId}</Ellipsis>
      </Column>
      <Column>
        {active.gt(0) || pendingInactive.gt(0) ? (
          <Box color="positiveGreen" pl={2}>
            <ToolTip content={<Trans i18nKey="aptos.stake.activeTooltip" />}>
              <CheckCircle size={14} />
            </ToolTip>
          </Box>
        ) : (
          <Box color="alertRed" pl={2}>
            <ToolTip content={<Trans i18nKey="aptos.stake.inactiveTooltip" />}>
              <ExclamationCircleThin size={14} />
            </ToolTip>
          </Box>
        )}
      </Column>
      <Column>
        <Ellipsis>
          <Discreet>{formattedAmount}</Discreet>
        </Ellipsis>
      </Column>
      <Column>
        <Ellipsis>
          <Discreet>{formattedPending}</Discreet>
        </Ellipsis>
      </Column>
      <Column>
        <Ellipsis>
          <Discreet>{formattedAvailable}</Discreet>
        </Ellipsis>
      </Column>
      <Column>
        <Ellipsis>
          <Discreet>{validator?.nextUnlockTime}</Discreet>
        </Ellipsis>
      </Column>
      <Column>
        {dropDownItems.length ? (
          <DropDown items={dropDownItems} renderItem={ManageDropDownItem} onChange={onSelect}>
            {() => (
              <Box horizontal alignItems="center">
                <Trans i18nKey="common.manage" />
                <div
                  style={{
                    transform: "rotate(90deg)",
                  }}
                >
                  <ChevronRight size={16} />
                </div>
              </Box>
            )}
          </DropDown>
        ) : null}
      </Column>
    </Wrapper>
  );
}
