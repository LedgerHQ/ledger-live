import React, { useCallback, useMemo } from "react";
import styled from "styled-components";
import { Trans } from "react-i18next";
import {
  CosmosAccount,
  CosmosMappedDelegation,
  CosmosMappedUnbonding,
} from "@ledgerhq/live-common/families/cosmos/types";
import {
  canRedelegate,
  canUndelegate,
  getRedelegationCompletionDate,
} from "@ledgerhq/live-common/families/cosmos/logic";
import { TableLine } from "./Header";
import DropDown, { DropDownItem } from "~/renderer/components/DropDownSelector";
import Box from "~/renderer/components/Box/Box";
import ChevronRight from "~/renderer/icons/ChevronRight";
import CheckCircle from "~/renderer/icons/CheckCircle";
import ExclamationCircleThin from "~/renderer/icons/ExclamationCircleThin";
import ToolTip from "~/renderer/components/Tooltip";
import CosmosFamilyLedgerValidatorIcon from "~/renderer/families/cosmos/shared/components/CosmosFamilyLedgerValidatorIcon";
import Text from "~/renderer/components/Text";
import { DelegationActionsModalName } from "../modals";
import Discreet from "~/renderer/components/Discreet";
import { useDateFromNow } from "~/renderer/hooks/useDateFormatter";
export const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 16px 20px;
`;
export const Column = styled(TableLine).attrs<{
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
export const Ellipsis = styled.div`
  flex: 1;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
export const Divider = styled.div`
  width: 100%;
  height: 1px;
  margin-bottom: ${p => p.theme.space[1]}px;
  background-color: ${p => p.theme.colors.palette.divider};
`;
export const ManageDropDownItem = ({
  item,
  isActive,
}: {
  item: {
    key: string;
    label: JSX.Element;
    disabled?: boolean;
    tooltip?: React.ReactNode;
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
  account: CosmosAccount;
  delegation: CosmosMappedDelegation;
  onManageAction: (address: string, action: DelegationActionsModalName) => void;
  onExternalLink: (address: string) => void;
  isCroAccount?: boolean;
};
export function Row({
  account,
  delegation: {
    validatorAddress,
    formattedAmount,
    pendingRewards,
    formattedPendingRewards,
    validator,
    status,
  },
  delegation,
  onManageAction,
  onExternalLink,
  isCroAccount,
}: Props) {
  const onSelect = useCallback(
    (action: (typeof dropDownItems)[number]) => {
      onManageAction(validatorAddress, action.key as DelegationActionsModalName);
    },
    [onManageAction, validatorAddress],
  );
  const _canUndelegate = !isCroAccount && canUndelegate(account);
  const _canRedelegate = !isCroAccount && canRedelegate(account, delegation);
  const redelegationDate = !_canRedelegate
    ? getRedelegationCompletionDate(account, delegation)
    : undefined;
  const formattedRedelegationDate = useDateFromNow(redelegationDate);
  const dropDownItems = useMemo(
    () =>
      [
        {
          key: "MODAL_COSMOS_REDELEGATE",
          label: <Trans i18nKey="cosmos.delegation.redelegate" />,
          disabled: !_canRedelegate,
          skip: isCroAccount,
          tooltip: !_canRedelegate ? (
            formattedRedelegationDate ? (
              <Trans
                i18nKey="cosmos.delegation.redelegateDisabledTooltip"
                values={{
                  days: formattedRedelegationDate,
                }}
              >
                <b></b>
              </Trans>
            ) : (
              <Trans i18nKey="cosmos.delegation.redelegateMaxDisabledTooltip">
                <b></b>
              </Trans>
            )
          ) : null,
        },
        {
          key: "MODAL_COSMOS_UNDELEGATE",
          label: <Trans i18nKey="cosmos.delegation.undelegate" />,
          disabled: !_canUndelegate,
          skip: isCroAccount,
          tooltip: !_canUndelegate ? (
            <Trans i18nKey="cosmos.delegation.undelegateDisabledTooltip">
              <b></b>
            </Trans>
          ) : null,
        },
        ...(pendingRewards.gt(0)
          ? [
              {
                key: "MODAL_COSMOS_CLAIM_REWARDS",
                label: <Trans i18nKey="cosmos.delegation.reward" />,
              },
            ]
          : []),
      ].filter(item => !item.skip),
    [pendingRewards, _canRedelegate, _canUndelegate, formattedRedelegationDate, isCroAccount],
  );
  const name = validator?.name ?? validatorAddress;
  const onExternalLinkClick = useCallback(
    () => onExternalLink(validatorAddress),
    [onExternalLink, validatorAddress],
  );
  return (
    <Wrapper>
      <Column strong clickable onClick={onExternalLinkClick}>
        <Box mr={2}>
          <CosmosFamilyLedgerValidatorIcon
            validator={
              validator ?? {
                validatorAddress,
                name: validatorAddress,
              }
            }
          />
        </Box>
        <Ellipsis>{name}</Ellipsis>
      </Column>
      <Column>
        {status === "bonded" ? (
          <Box color="positiveGreen" pl={2}>
            <ToolTip content={<Trans i18nKey="cosmos.delegation.activeTooltip" />}>
              <CheckCircle size={14} />
            </ToolTip>
          </Box>
        ) : (
          <Box color="alertRed" pl={2}>
            <ToolTip content={<Trans i18nKey="cosmos.delegation.inactiveTooltip" />}>
              <ExclamationCircleThin size={14} />
            </ToolTip>
          </Box>
        )}
      </Column>
      <Column>
        <Discreet>{formattedAmount}</Discreet>
      </Column>
      <Column>
        <Discreet>{formattedPendingRewards}</Discreet>
      </Column>
      <Column>
        <DropDown
          items={dropDownItems}
          renderItem={({ item, isActive }) => {
            if (item.key === "MODAL_COSMOS_CLAIM_REWARDS" && !isCroAccount)
              return (
                <>
                  <Divider />
                  <ManageDropDownItem item={item} isActive={isActive} />
                </>
              );
            return <ManageDropDownItem item={item} isActive={isActive} />;
          }}
          onChange={onSelect}
        >
          {() => (
            <Box flex={1} horizontal alignItems="center">
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
type UnbondingRowProps = {
  delegation: CosmosMappedUnbonding;
  onExternalLink: (address: string) => void;
};
export function UnbondingRow({
  delegation: { validator, formattedAmount, validatorAddress, completionDate },
  onExternalLink,
}: UnbondingRowProps) {
  const date = useDateFromNow(completionDate) || "N/A";

  const name = validator?.name ?? validatorAddress;
  const onExternalLinkClick = useCallback(
    () => onExternalLink(validatorAddress),
    [onExternalLink, validatorAddress],
  );
  return (
    <Wrapper>
      <Column strong clickable onClick={onExternalLinkClick}>
        <Box mr={2}>
          <CosmosFamilyLedgerValidatorIcon
            validator={
              validator ?? {
                validatorAddress,
                name: validatorAddress,
              }
            }
          />
        </Box>
        <Ellipsis>{name}</Ellipsis>
      </Column>
      <Column>
        <Box color="alertRed" pl={2}>
          <ToolTip content={<Trans i18nKey="cosmos.undelegation.inactiveTooltip" />}>
            <ExclamationCircleThin size={14} />
          </ToolTip>
        </Box>
      </Column>
      <Column>
        <Discreet>{formattedAmount} </Discreet>
      </Column>
      <Column>{date}</Column>
    </Wrapper>
  );
}
