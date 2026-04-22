import React, { useCallback, useMemo } from "react";
import styled from "styled-components";
import { Trans } from "react-i18next";
import type {
  StakingAccount,
  StakingMappedDelegation,
  StakingMappedRedelegation,
  StakingMappedUnbonding,
} from "@ledgerhq/live-common/families/evm/staking/types";
import {
  canRedelegate,
  canUndelegate,
  getRedelegationCompletionDate,
} from "@ledgerhq/live-common/families/evm/staking/logic";
import { TableLine } from "./Header";
import DropDown, { DropDownItem } from "~/renderer/components/DropDownSelector";
import Box from "~/renderer/components/Box/Box";
import ChevronRight from "~/renderer/icons/ChevronRight";
import CheckCircle from "~/renderer/icons/CheckCircle";
import ExclamationCircleThin from "~/renderer/icons/ExclamationCircleThin";
import ToolTip from "~/renderer/components/Tooltip";
import EvmValidatorIcon from "~/renderer/families/evm/shared/components/EvmValidatorIcon";
import Text from "~/renderer/components/Text";
import Discreet from "~/renderer/components/Discreet";
import { useDateFromNow } from "~/renderer/hooks/useDateFormatter";
import type { DelegationActionsModalName } from "../modals";

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
  background-color: ${p => p.theme.colors.neutral.c40};
`;

export const ManageDropDownItem = ({
  item,
  isActive,
}: {
  item: {
    key: string;
    label: React.JSX.Element;
    disabled?: boolean;
    tooltip?: React.ReactNode;
  };
  isActive: boolean;
}) => {
  return (
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
  );
};

type RowProps = Readonly<{
  account: StakingAccount;
  delegation: StakingMappedDelegation;
  onManageAction: (address: string, action: DelegationActionsModalName) => void;
  onClaimRewards: (address: string) => void;
  onExternalLink: (address: string) => void;
}>;

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
  onClaimRewards,
  onExternalLink,
}: RowProps) {
  const onSelect = useCallback(
    (action: (typeof dropDownItems)[number]) => {
      if (action.key === "MODAL_EVM_CLAIM_REWARDS") {
        onClaimRewards(validatorAddress);
      } else {
        onManageAction(validatorAddress, action.key);
      }
    },
    [onManageAction, onClaimRewards, validatorAddress],
  );
  const _canUndelegate = canUndelegate(account);
  const _canRedelegate = canRedelegate(account, delegation);
  const redelegationDate = _canRedelegate
    ? undefined
    : getRedelegationCompletionDate(account, delegation);
  const formattedRedelegationDate = useDateFromNow(redelegationDate);
  const redelegateDisabledTooltip = useMemo(() => {
    if (_canRedelegate) return null;
    if (formattedRedelegationDate) {
      return (
        <Trans
          i18nKey="ethereum.evmStaking.delegation.redelegateDisabledTooltip"
          values={{ days: formattedRedelegationDate }}
        >
          <b></b>
        </Trans>
      );
    }
    return (
      <Trans i18nKey="ethereum.evmStaking.delegation.redelegateMaxDisabledTooltip">
        <b></b>
      </Trans>
    );
  }, [_canRedelegate, formattedRedelegationDate]);
  type DropDownItem = {
    key: DelegationActionsModalName | "MODAL_EVM_CLAIM_REWARDS";
    label: React.JSX.Element;
    disabled?: boolean;
    tooltip?: React.ReactNode | null;
  };
  const dropDownItems = useMemo<DropDownItem[]>(
    () => [
      {
        key: "MODAL_EVM_REDELEGATE",
        label: <Trans i18nKey="ethereum.evmStaking.delegation.redelegate" />,
        disabled: !_canRedelegate,
        tooltip: redelegateDisabledTooltip,
      },
      {
        key: "MODAL_EVM_UNDELEGATE",
        label: <Trans i18nKey="ethereum.evmStaking.delegation.undelegate" />,
        disabled: !_canUndelegate,
        tooltip: _canUndelegate ? null : (
          <Trans i18nKey="ethereum.evmStaking.delegation.undelegateDisabledTooltip">
            <b></b>
          </Trans>
        ),
      },
      ...(pendingRewards.gt(0)
        ? ([
            {
              key: "MODAL_EVM_CLAIM_REWARDS" as const,
              label: <Trans i18nKey="ethereum.evmStaking.delegation.reward" />,
            },
          ] satisfies DropDownItem[])
        : []),
    ],
    [pendingRewards, _canRedelegate, _canUndelegate, redelegateDisabledTooltip],
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
          <EvmValidatorIcon
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
            <ToolTip content={<Trans i18nKey="ethereum.evmStaking.delegation.activeTooltip" />}>
              <CheckCircle size={14} />
            </ToolTip>
          </Box>
        ) : (
          <Box color="alertRed" pl={2}>
            <ToolTip content={<Trans i18nKey="ethereum.evmStaking.delegation.inactiveTooltip" />}>
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
            if (item.key === "MODAL_EVM_CLAIM_REWARDS")
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
              <div style={{ transform: "rotate(90deg)" }}>
                <ChevronRight size={16} />
              </div>
            </Box>
          )}
        </DropDown>
      </Column>
    </Wrapper>
  );
}

type UnbondingRowProps = Readonly<{
  delegation: StakingMappedUnbonding;
  onExternalLink: (address: string) => void;
}>;

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
          <EvmValidatorIcon
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
          <ToolTip content={<Trans i18nKey="ethereum.evmStaking.undelegation.inactiveTooltip" />}>
            <ExclamationCircleThin size={14} />
          </ToolTip>
        </Box>
      </Column>
      <Column>
        <Discreet>{formattedAmount}</Discreet>
      </Column>
      <Column>{date}</Column>
    </Wrapper>
  );
}

type RedelegationRowProps = Readonly<{
  redelegation: StakingMappedRedelegation;
  onExternalLink: (address: string) => void;
}>;

export function RedelegationRow({
  redelegation: {
    validatorSrcAddress,
    validatorDstAddress,
    formattedAmount,
    validatorSrc,
    validatorDst,
  },
  onExternalLink,
}: RedelegationRowProps) {
  const srcName = validatorSrc?.name ?? validatorSrcAddress;
  const dstName = validatorDst?.name ?? validatorDstAddress;
  const onSrcClick = useCallback(
    () => onExternalLink(validatorSrcAddress),
    [onExternalLink, validatorSrcAddress],
  );
  const onDstClick = useCallback(
    () => onExternalLink(validatorDstAddress),
    [onExternalLink, validatorDstAddress],
  );
  return (
    <Wrapper>
      <Column strong clickable onClick={onSrcClick}>
        <Box mr={2}>
          <EvmValidatorIcon
            validator={
              validatorSrc ?? {
                validatorAddress: validatorSrcAddress,
                name: validatorSrcAddress,
              }
            }
          />
        </Box>
        <Ellipsis>{srcName}</Ellipsis>
      </Column>
      <Column strong clickable onClick={onDstClick}>
        <Box mr={2}>
          <EvmValidatorIcon
            validator={
              validatorDst ?? {
                validatorAddress: validatorDstAddress,
                name: validatorDstAddress,
              }
            }
          />
        </Box>
        <Ellipsis>{dstName}</Ellipsis>
      </Column>
      <Column>
        <Discreet>{formattedAmount}</Discreet>
      </Column>
    </Wrapper>
  );
}
