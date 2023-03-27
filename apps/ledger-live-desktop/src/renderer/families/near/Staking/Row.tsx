import React, { useCallback } from "react";
import styled from "styled-components";
import { Trans } from "react-i18next";
import { ThemedComponent } from "~/renderer/styles/StyleProvider";
import { NearMappedStakingPosition } from "@ledgerhq/live-common/families/near/types";
import { Account } from "@ledgerhq/live-common/types/index";
import { canUnstake, canWithdraw } from "@ledgerhq/live-common/families/near/logic";
import { TableLine } from "./Header";
import DropDown, { DropDownItem } from "~/renderer/components/DropDownSelector";
import Box from "~/renderer/components/Box/Box";
import ChevronRight from "~/renderer/icons/ChevronRight";
import CheckCircle from "~/renderer/icons/CheckCircle";
import ExclamationCircleThin from "~/renderer/icons/ExclamationCircleThin";
import ToolTip from "~/renderer/components/Tooltip";
import LedgerValidatorIcon from "~/renderer/families/near/shared/components/LedgerValidatorIcon";
import Text from "~/renderer/components/Text";
const Wrapper: ThemedComponent<any> = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 16px 20px;
`;
const Column: ThemedComponent<{
  clickable?: boolean;
}> = styled(TableLine).attrs(p => ({
  ff: "Inter|SemiBold",
  color: p.strong ? "palette.text.shade100" : "palette.text.shade80",
  fontSize: 3,
}))`
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
  item: {
    key: string;
    label: string;
    disabled: boolean;
    tooltip: React.ReactNode;
  };
  isActive: boolean;
}) => {
  return (
    <>
      <ToolTip
        content={item.tooltip}
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
  stakingPosition: NearMappedStakingPosition;
  onManageAction: (address: string, action: "MODAL_NEAR_UNSTAKE" | "MODAL_NEAR_WITHDRAW") => void;
  onExternalLink: (address: string) => void;
};
export function Row({
  account,
  stakingPosition: {
    validatorId,
    staked,
    formattedAmount,
    formattedRewards,
    formattedPending,
    formattedAvailable,
    validator,
  },
  stakingPosition,
  onManageAction,
  onExternalLink,
}: Props) {
  const unstakingEnabled = canUnstake(stakingPosition);
  const withdawingEnabled = canWithdraw(stakingPosition);
  const onSelect = useCallback(
    action => {
      onManageAction(validatorId, action.key);
    },
    [onManageAction, validatorId],
  );
  const dropDownItems = [
    {
      key: "MODAL_NEAR_UNSTAKE",
      label: <Trans i18nKey="near.stake.unstake" />,
      disabled: !unstakingEnabled,
      tooltip: !unstakingEnabled ? <Trans i18nKey="near.unstake.disabledTooltip" /> : null,
    },
    {
      key: "MODAL_NEAR_WITHDRAW",
      label: <Trans i18nKey="near.stake.withdraw" />,
      disabled: !withdawingEnabled,
      tooltip: !withdawingEnabled ? <Trans i18nKey="near.withdraw.disabledTooltip" /> : null,
    },
  ];
  const onExternalLinkClick = useCallback(() => onExternalLink(validatorId), [
    onExternalLink,
    validatorId,
  ]);
  return (
    <Wrapper>
      <Column strong clickable onClick={onExternalLinkClick}>
        <Box mr={2}>
          <LedgerValidatorIcon validator={validator} validatorId={validatorId} />
        </Box>
        <Ellipsis>{validatorId}</Ellipsis>
      </Column>
      <Column>
        {staked.gt(0) ? (
          <Box color="positiveGreen" pl={2}>
            <ToolTip content={<Trans i18nKey="near.stake.activeTooltip" />}>
              <CheckCircle size={14} />
            </ToolTip>
          </Box>
        ) : (
          <Box color="alertRed" pl={2}>
            <ToolTip content={<Trans i18nKey="near.stake.inactiveTooltip" />}>
              <ExclamationCircleThin size={14} />
            </ToolTip>
          </Box>
        )}
      </Column>
      <Column>
        <Ellipsis>{formattedAmount}</Ellipsis>
      </Column>
      <Column>
        <Ellipsis>{formattedRewards}</Ellipsis>
      </Column>
      <Column>
        <Ellipsis>{formattedPending}</Ellipsis>
      </Column>
      <Column>
        <Ellipsis>{formattedAvailable}</Ellipsis>
      </Column>
      <Column>
        <DropDown items={dropDownItems} renderItem={ManageDropDownItem} onChange={onSelect}>
          {({ isOpen, value }) => (
            <Box flex horizontal alignItems="center">
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
