import React, { useCallback } from "react";
import styled from "styled-components";
import { Trans } from "react-i18next";
import { TableLine } from "./Header";
import DropDown, { DropDownItem } from "~/renderer/components/DropDownSelector";
import Box from "~/renderer/components/Box/Box";
import ChevronRight from "~/renderer/icons/ChevronRight";
import CheckCircle from "~/renderer/icons/CheckCircle";
import ExclamationCircleThin from "~/renderer/icons/ExclamationCircleThin";
import ToolTip from "~/renderer/components/Tooltip";
import LedgerValidatorIcon from "~/renderer/families/sui/shared/components/LedgerValidatorIcon";
import Text from "~/renderer/components/Text";
import Discreet from "~/renderer/components/Discreet";
import { MappedStake } from "@ledgerhq/live-common/families/sui/types";

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
  item: {
    key: string;
    label?: React.ReactNode;
    disabled: boolean;
    content?: React.ReactNode;
  };
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
  readonly stakingPosition: MappedStake;
  readonly onManageAction: (
    address: string,
    stakedSuiId: string,
    amount: string,
    action: "MODAL_SUI_UNSTAKE",
  ) => void;
  readonly onExternalLink: (address: string) => void;
};
export function Row({
  stakingPosition: {
    stakedSuiId,
    validator,
    formattedAmount,
    status,
    principal,
    formattedEstimatedReward,
  },
  onManageAction,
  onExternalLink,
}: Props) {
  const { suiAddress, name } = validator;
  const unstakingEnabled = status === "Active";
  const onSelect = useCallback(
    (action: (typeof dropDownItems)[0]) => {
      onManageAction(suiAddress, stakedSuiId, principal, action.key);
    },
    [onManageAction, suiAddress, stakedSuiId, principal],
  );
  const dropDownItems = [
    {
      key: "MODAL_SUI_UNSTAKE",
      label: <Trans i18nKey="sui.stake.unstake" />,
      tooltip: !unstakingEnabled ? <Trans i18nKey="sui.unstake.disabledTooltip" /> : null,
      disabled: false,
    } as const,
  ];
  const onExternalLinkClick = useCallback(
    () => onExternalLink(suiAddress),
    [onExternalLink, suiAddress],
  );
  return (
    <Wrapper>
      <Column strong clickable onClick={onExternalLinkClick}>
        <Box mr={2}>
          <LedgerValidatorIcon validator={validator} validatorId={suiAddress} />
        </Box>
        <Ellipsis>{name || suiAddress}</Ellipsis>
      </Column>
      <Column>
        {status === "Active" ? (
          <Box color="positiveGreen" pl={2}>
            <ToolTip content={<Trans i18nKey="sui.stake.activeTooltip" />}>
              <CheckCircle size={14} />
            </ToolTip>
          </Box>
        ) : (
          <Box color="legacyWarning" pl={2}>
            <ToolTip content={<Trans i18nKey="sui.stake.inactiveTooltip" />}>
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
          <Discreet>{formattedEstimatedReward}</Discreet>
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
