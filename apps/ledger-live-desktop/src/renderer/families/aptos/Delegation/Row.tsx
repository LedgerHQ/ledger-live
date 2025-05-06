import React, { useCallback } from "react";
import styled from "styled-components";
import { Trans } from "react-i18next";

import { Account } from "@ledgerhq/types-live";

import { TableLine } from "./Header";
import DropDown, { DropDownItem } from "~/renderer/components/DropDownSelector";
import Box from "~/renderer/components/Box/Box";
import ChevronRight from "~/renderer/icons/ChevronRight";
import CheckCircle from "~/renderer/icons/CheckCircle";
import ExclamationCircleThin from "~/renderer/icons/ExclamationCircleThin";
import ToolTip from "~/renderer/components/Tooltip";

import Text from "~/renderer/components/Text";
import Discreet from "~/renderer/components/Discreet";
import BigNumber from "bignumber.js";

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
  color: p.strong ? "palette.text.shade100" : "palette.text.shade80",
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
const ManageDropDownItem = ({
  item,
  isActive,
}: {
  item: {
    key: string;
    label?: React.ReactNode;
    disabled: boolean;
    content?: React.ReactNode;
  };
  isActive: boolean;
}) => {
  return (
    <>
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
    </>
  );
};
type Props = {
  account: Account;
  stakingPosition: AptosMappedStakingPosition;
  onManageAction: (address: string, action: "MODAL_APTOS_UNSTAKE" | "MODAL_APTOS_WITHDRAW") => void;
  onExternalLink: (address: string) => void;
};
export function Row({ stakingPosition, onManageAction, onExternalLink }: Props) {
  console.log("stakingPosition", stakingPosition);
  const unstakingEnabled = (): boolean => {
    return false;
  };
  const withdawingEnabled = (): boolean => {
    return false;
  };
  const onSelect = useCallback(
    (action: (typeof dropDownItems)[number]) => {
      onManageAction(
        stakingPosition.validatorId || "",
        action.key as "MODAL_APTOS_UNSTAKE" | "MODAL_APTOS_WITHDRAW",
      );
    },
    [onManageAction, stakingPosition],
  );
  const dropDownItems = [
    {
      key: "MODAL_APTOS_UNSTAKE",
      label: <Trans i18nKey="aptos.stake.unstake" />,
      disabled: !unstakingEnabled,
      tooltip: !unstakingEnabled ? <Trans i18nKey="aptos.unstake.disabledTooltip" /> : null,
    },
    {
      key: "MODAL_APTOS_WITHDRAW",
      label: <Trans i18nKey="aptos.stake.withdraw" />,
      disabled: !withdawingEnabled,
      tooltip: !withdawingEnabled ? <Trans i18nKey="aptos.withdraw.disabledTooltip" /> : null,
    },
  ];
  const onExternalLinkClick = useCallback(
    () => onExternalLink(stakingPosition.validatorId),
    [onExternalLink, stakingPosition.validatorId],
  );
  return (
    <Wrapper>
      <Column strong clickable onClick={onExternalLinkClick}>
        <Box mr={2}>{""}</Box>
        <Ellipsis>{stakingPosition.validatorId}</Ellipsis>
      </Column>
      <Column>
        {stakingPosition.staked.gt(0) ? (
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
          <Discreet>{stakingPosition.formattedAmount}</Discreet>
        </Ellipsis>
      </Column>
      <Column>
        <Ellipsis>
          <Discreet>{stakingPosition.formattedPending}</Discreet>
        </Ellipsis>
      </Column>
      <Column>
        <Ellipsis>
          <Discreet>{stakingPosition.formattedAvailable}</Discreet>
        </Ellipsis>
      </Column>
      <Column>
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
      </Column>
    </Wrapper>
  );
}

export type AptosMappedStakingPosition = AptosStakingPosition & {
  formattedAmount: string;
  formattedPending: string;
  formattedAvailable: string;
  rank: number;
  validator: AptosValidatorItem | null | undefined;
};

export type AptosStakingPosition = {
  staked: BigNumber;
  available: BigNumber;
  pending: BigNumber;
  validatorId: string;
};

export type AptosValidatorItem = {
  validatorAddress: string;
  commission: number | null;
  tokens: string;
};
