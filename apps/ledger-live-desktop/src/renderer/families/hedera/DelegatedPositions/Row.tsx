import React, { useCallback } from "react";
import styled from "styled-components";
import { Trans } from "react-i18next";
import { useSelector } from "react-redux";
import { HEDERA_DELEGATION_STATUS } from "@ledgerhq/live-common/families/hedera/constants";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";
import type {
  HederaAccount,
  HederaEnrichedDelegation,
} from "@ledgerhq/live-common/families/hedera/types";
import DropDown, { DropDownItem } from "~/renderer/components/DropDownSelector";
import Box from "~/renderer/components/Box/Box";
import ChevronRight from "~/renderer/icons/ChevronRight";
import CheckCircle from "~/renderer/icons/CheckCircle";
import ExclamationCircleThin from "~/renderer/icons/ExclamationCircleThin";
import ToolTip from "~/renderer/components/Tooltip";
import Text from "~/renderer/components/Text";
import Discreet, { useDiscreetMode } from "~/renderer/components/Discreet";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { localeSelector } from "~/renderer/reducers/settings";
import type { DelegateModalName } from "../modals";
import ValidatorIcon from "../shared/staking/ValidatorIcon";
import { TableLine } from "./Header";

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
  cursor: ${p => (p.clickable ? "pointer" : "default")};
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

const DelegationStatus = ({ status }: { status: HEDERA_DELEGATION_STATUS }) => {
  if (status === HEDERA_DELEGATION_STATUS.Inactive) {
    return (
      <Box color="alertRed" pl={2}>
        <ToolTip
          content={
            <Trans i18nKey="hedera.account.bodyHeader.delegatedPositions.columns.inactiveTooltip" />
          }
        >
          <ExclamationCircleThin size={14} />
        </ToolTip>
      </Box>
    );
  }

  if (status === HEDERA_DELEGATION_STATUS.Overstaked) {
    return (
      <Box color="warning" pl={2}>
        <ToolTip
          content={
            <Trans i18nKey="hedera.account.bodyHeader.delegatedPositions.columns.overstakedTooltip" />
          }
        >
          <ExclamationCircleThin size={14} />
        </ToolTip>
      </Box>
    );
  }

  return (
    <Box color="positiveGreen" pl={2}>
      <ToolTip
        content={
          <Trans i18nKey="hedera.account.bodyHeader.delegatedPositions.columns.activeTooltip" />
        }
      >
        <CheckCircle size={14} />
      </ToolTip>
    </Box>
  );
};

type Props = {
  account: HederaAccount;
  enrichedDelegation: HederaEnrichedDelegation;
  onManageAction: (action: DelegateModalName) => void;
  onExternalLink: (enrichedDelegation: HederaEnrichedDelegation) => void;
};

export function Row({
  account,
  enrichedDelegation,
  onManageAction,
  onExternalLink,
}: Readonly<Props>) {
  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
  const unit = useAccountUnit(account);

  const isValidatorRemoved =
    !enrichedDelegation.validator.address && typeof enrichedDelegation.nodeId === "number";

  const formatConfig = {
    alwaysShowSign: false,
    showCode: true,
    discreet,
    locale,
  };

  const formattedDelegatedAssets = formatCurrencyUnit(
    unit,
    enrichedDelegation.delegated,
    formatConfig,
  );
  const formattedClaimableRewards = formatCurrencyUnit(
    unit,
    enrichedDelegation.pendingReward,
    formatConfig,
  );

  const dropDownItems = [
    {
      key: "MODAL_HEDERA_REDELEGATION",
      label: <Trans i18nKey="hedera.account.bodyHeader.delegatedPositions.actions.redelegation" />,
      disabled: false,
    } as const,
    {
      key: "MODAL_HEDERA_UNDELEGATION",
      label: <Trans i18nKey="hedera.account.bodyHeader.delegatedPositions.actions.undelegation" />,
      disabled: false,
    } as const,
    {
      key: "MODAL_HEDERA_CLAIM_REWARDS",
      label: <Trans i18nKey="hedera.account.bodyHeader.delegatedPositions.actions.claimRewards" />,
      disabled: enrichedDelegation.pendingReward.eq(0),
    } as const,
  ];

  const onSelect = useCallback(
    (action: (typeof dropDownItems)[0]) => {
      onManageAction(action.key);
    },
    [onManageAction],
  );

  return (
    <Wrapper>
      {isValidatorRemoved ? (
        <Column />
      ) : (
        <Column
          strong
          clickable
          onClick={() => {
            onExternalLink(enrichedDelegation);
          }}
        >
          <Box mr={2}>
            <ValidatorIcon validator={enrichedDelegation.validator} />
          </Box>
          <Ellipsis>{enrichedDelegation.validator.name}</Ellipsis>
        </Column>
      )}
      <Column>
        <DelegationStatus status={enrichedDelegation.status} />
      </Column>
      <Column>
        <Ellipsis>
          <Discreet>{formattedDelegatedAssets}</Discreet>
        </Ellipsis>
      </Column>
      <Column>
        <Ellipsis>
          <Discreet>{formattedClaimableRewards}</Discreet>
        </Ellipsis>
      </Column>
      <Column>
        <DropDown items={dropDownItems} renderItem={ManageDropDownItem} onChange={onSelect}>
          {() => (
            <Box horizontal alignItems="center">
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
