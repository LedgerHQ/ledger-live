// @flow

import React, { useCallback, useMemo } from "react";
import { Trans } from "react-i18next";
import moment from "moment";

import type { CosmosMappedDelegation } from "@ledgerhq/live-common/families/cosmos/types";
import type { Account } from "@ledgerhq/live-common/types/index";
import {
  canRedelegate,
  canUndelegate,
  getRedelegationCompletionDate,
} from "@ledgerhq/live-common/families/cosmos/logic";

import {
  ManageDropDownItem,
  Divider,
  Ellipsis,
  Wrapper,
  Column,
} from "../../cosmos/Delegation/Row";
import DropDown from "~/renderer/components/DropDownSelector";

import Box from "~/renderer/components/Box/Box";
import ChevronRight from "~/renderer/icons/ChevronRight";
import CheckCircle from "~/renderer/icons/CheckCircle";
import ExclamationCircleThin from "~/renderer/icons/ExclamationCircleThin";
import ToolTip from "~/renderer/components/Tooltip";
import CosmosFamilyLedgerValidatorIcon from "~/renderer/families/cosmos/shared/components/CosmosFamilyLedgerValidatorIcon";

export { UnbondingRow } from "../../cosmos/Delegation/Row";

type Props = {
  account: Account,
  delegation: CosmosMappedDelegation,
  onManageAction: (
    address: string,
    action: "MODAL_OSMOSIS_REDELEGATE" | "MODAL_COSMOS_UNDELEGATE" | "MODAL_COSMOS_CLAIM_REWARDS",
  ) => void,
  onExternalLink: (address: string) => void,
};

export const Row = ({
  account,
  delegation: {
    amount,
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
}: Props) => {
  const onSelect = useCallback(
    action => {
      onManageAction(validatorAddress, action.key);
    },
    [onManageAction, validatorAddress],
  );

  const _canUndelegate = canUndelegate(account);
  const _canRedelegate = canRedelegate(account, delegation);

  const redelegationDate = !_canRedelegate && getRedelegationCompletionDate(account, delegation);
  const formattedRedelegationDate = redelegationDate ? moment(redelegationDate).fromNow() : "";

  const dropDownItems = useMemo(
    () => [
      {
        key: "MODAL_OSMOSIS_REDELEGATE",
        label: <Trans i18nKey="osmosis.delegation.redelegate" />,
        disabled: !_canRedelegate,
        tooltip: !_canRedelegate ? (
          formattedRedelegationDate ? (
            <Trans
              i18nKey="osmosis.delegation.redelegateDisabledTooltip"
              values={{ days: formattedRedelegationDate }}
            >
              <b></b>
            </Trans>
          ) : (
            <Trans i18nKey="osmosis.delegation.redelegateMaxDisabledTooltip">
              <b></b>
            </Trans>
          )
        ) : null,
      },
      {
        key: "MODAL_COSMOS_UNDELEGATE",
        label: <Trans i18nKey="osmosis.delegation.undelegate" />,
        disabled: !_canUndelegate,
        tooltip: !_canUndelegate ? (
          <Trans i18nKey="osmosis.delegation.undelegateDisabledTooltip">
            <b></b>
          </Trans>
        ) : null,
      },
      ...(pendingRewards.gt(0)
        ? [
            {
              key: "MODAL_COSMOS_CLAIM_REWARDS",
              label: <Trans i18nKey="osmosis.delegation.reward" />,
            },
          ]
        : []),
    ],
    [pendingRewards, _canRedelegate, _canUndelegate, formattedRedelegationDate],
  );
  const name = validator?.name ?? validatorAddress;

  const onExternalLinkClick = useCallback(() => onExternalLink(validatorAddress), [
    onExternalLink,
    validatorAddress,
  ]);

  return (
    <Wrapper>
      <Column strong clickable onClick={onExternalLinkClick}>
        <Box mr={2}>
          <CosmosFamilyLedgerValidatorIcon
            validator={validator ?? { validatorAddress, name: validatorAddress }}
          />
        </Box>
        <Ellipsis>{name}</Ellipsis>
      </Column>
      <Column>
        {status === "bonded" ? (
          <Box color="positiveGreen" pl={2}>
            <ToolTip content={<Trans i18nKey="osmosis.delegation.activeTooltip" />}>
              <CheckCircle size={14} />
            </ToolTip>
          </Box>
        ) : (
          <Box color="alertRed" pl={2}>
            <ToolTip content={<Trans i18nKey="osmosis.delegation.inactiveTooltip" />}>
              <ExclamationCircleThin size={14} />
            </ToolTip>
          </Box>
        )}
      </Column>
      <Column>{formattedAmount}</Column>
      <Column>{formattedPendingRewards}</Column>
      <Column>
        <DropDown
          items={dropDownItems}
          renderItem={({ item, isActive }) => {
            if (item.key === "MODAL_COSMOS_CLAIM_REWARDS")
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
          {({ isOpen, value }) => (
            <Box flex horizontal alignItems="center">
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
};
