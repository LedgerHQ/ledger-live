// @flow

import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { stakeActions as heliumStakeActions } from "@ledgerhq/live-common/families/helium/logic";
import type { Account } from "@ledgerhq/live-common/types/index";
import { BigNumber } from "bignumber.js";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import DropDown, { DropDownItem } from "~/renderer/components/DropDownSelector";
import Text from "~/renderer/components/Text";
import ToolTip from "~/renderer/components/Tooltip";
import CheckCircle from "~/renderer/icons/CheckCircle";
import ChevronRight from "~/renderer/icons/ChevronRight";
import ExclamationCircleThin from "~/renderer/icons/ExclamationCircleThin";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";
import { TableLine } from "./Header";

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
  validator: any,
  onManageAction: (validator: any, action: string) => void,
  onExternalLink: (address: string) => void,
};

export function Row({ account, validator, onManageAction, onExternalLink }: Props) {
  const onSelect = useCallback(
    action => {
      onManageAction(validator, action.key);
    },
    [onManageAction],
  );

  const {
    stake,
    status: { online },
    stakeStatus,
  } = validator;

  const stakeActions = heliumStakeActions(validator).map(toStakeDropDownItem);

  const validatorName = validator.name;

  const onExternalLinkClick = () => onExternalLink(stake);

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
        <Ellipsis>{validatorName}</Ellipsis>
      </Column>
      <Column>
        {stakeStatus === "staked" && (
          <Box color="positiveGreen">
            <ToolTip content={<Trans i18nKey="helium.delegation.stakedTooltip" />}>
              <CheckCircle size={14} />
            </ToolTip>
          </Box>
        )}
        {stakeStatus !== "staked" && (
          <Box color="alertRed">
            <ToolTip content={<Trans i18nKey="helium.delegation.unstakedTooltip" />}>
              <ExclamationCircleThin size={14} />
            </ToolTip>
          </Box>
        )}
        <Box ml={1}>{stakeStatus}</Box>
      </Column>
      <Column>{formatAmount(stake.integerBalance ?? 0)}</Column>
      <Column>
        {online === "online" && (
          <Box color="positiveGreen">
            <ToolTip content={<Trans i18nKey="helium.delegation.activeTooltip" />}>
              <CheckCircle size={14} />
            </ToolTip>
          </Box>
        )}
        {online === "offline" && (
          <Box color="alertRed">
            <ToolTip content={<Trans i18nKey="helium.delegation.inactiveTooltip" />}>
              <ExclamationCircleThin size={14} />
            </ToolTip>
          </Box>
        )}
        <Box ml={1}>{online}</Box>
      </Column>
      <Column>
        <DropDown items={stakeActions} renderItem={ManageDropDownItem} onChange={onSelect}>
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
      </Column>
    </Wrapper>
  );
}

function toStakeDropDownItem(stakeAction: string) {
  switch (stakeAction) {
    case "unstake":
      return {
        key: "MODAL_HELIUM_UNSTAKE",
        label: <Trans i18nKey="helium.delegation.unstake.flow.title" />,
      };
    case "transfer":
      return {
        key: "MODAL_HELIUM_TRANSFER_STAKE",
        label: <Trans i18nKey="helium.delegation.transfer.flow.title" />,
      };
    default:
      throw new Error(`unsupported stake action: ${stakeAction}`);
  }
}
