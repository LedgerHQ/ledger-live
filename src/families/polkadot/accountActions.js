// @flow
import React from "react";
import { Trans } from "react-i18next";
import type { Account } from "@ledgerhq/live-common/lib/types";

import {
  canNominate,
  canBond,
  canUnbond,
  hasExternalController,
  hasExternalStash,
  hasPendingOperationType,
} from "@ledgerhq/live-common/lib/families/polkadot/logic";
import { getCurrentPolkadotPreloadData } from "@ledgerhq/live-common/lib/families/polkadot/preload";

import BondIcon from "../../icons/LinkIcon";
import UnbondIcon from "../../icons/Undelegate";
import WithdrawUnbondedIcon from "../../icons/Coins";
import NominateIcon from "../../icons/Vote";
import ChillIcon from "../../icons/VoteNay";
import { NavigatorName, ScreenName } from "../../const";

const getActions = ({ account }: { account: Account }) => {
  if (!account.polkadotResources) return null;

  const { staking } = getCurrentPolkadotPreloadData();

  const accountId = account.id;

  const { unlockedBalance, lockedBalance, nominations } =
    account.polkadotResources || {};

  const electionOpen =
    staking?.electionClosed !== undefined ? !staking?.electionClosed : false;
  const hasUnlockedBalance = unlockedBalance && unlockedBalance.gt(0);
  const hasBondedBalance = lockedBalance && lockedBalance.gt(0);
  const hasPendingBondOperation = hasPendingOperationType(account, "BOND");
  const hasPendingWithdrawUnbondedOperation = hasPendingOperationType(
    account,
    "WITHDRAW_UNBONDED",
  );

  const nominationEnabled = !electionOpen && canNominate(account);
  const chillEnabled =
    !electionOpen && canNominate(account) && nominations?.length;
  const bondingEnabled =
    !electionOpen &&
    ((!hasBondedBalance && !hasPendingBondOperation) ||
      (hasBondedBalance && canBond(account)));
  const unbondingEnabled = !electionOpen && canUnbond(account);
  const withdrawEnabled =
    !electionOpen && hasUnlockedBalance && !hasPendingWithdrawUnbondedOperation;

  if (hasExternalController(account) || hasExternalStash(account)) {
    return null;
  }

  return [
    {
      disabled: !bondingEnabled,
      navigationParams: [
        NavigatorName.PolkadotBondFlow,
        {
          screen: ScreenName.PolkadotBondAmount,
          params: { accountId },
        },
      ],
      label: <Trans i18nKey="polkadot.manage.bond.title" />,
      description: <Trans i18nKey="polkadot.manage.bond.description" />,
      Icon: BondIcon,
    },
    {
      disabled: !unbondingEnabled,
      navigationParams: [
        NavigatorName.PolkadotUnbondFlow,
        {
          screen: ScreenName.PolkadotUnbondAmount,
          params: { accountId },
        },
      ],
      label: <Trans i18nKey="polkadot.manage.unbond.title" />,
      description: <Trans i18nKey="polkadot.manage.unbond.description" />,
      Icon: UnbondIcon,
    },
    {
      disabled: !withdrawEnabled,
      navigationParams: [
        NavigatorName.PolkadotSimpleOperationFlow,
        {
          screen: ScreenName.PolkadotSimpleOperationStarted,
          params: { mode: "withdrawUnbonded", accountId },
        },
      ],
      label: <Trans i18nKey="polkadot.manage.withdrawUnbonded.title" />,
      description: (
        <Trans i18nKey="polkadot.manage.withdrawUnbonded.description" />
      ),
      Icon: WithdrawUnbondedIcon,
    },
    {
      disabled: !nominationEnabled,
      navigationParams: [
        NavigatorName.PolkadotNominateFlow,
        {
          screen: ScreenName.PolkadotNominateSelectValidators,
          params: { accountId },
        },
      ],
      label: <Trans i18nKey="polkadot.manage.nominate.title" />,
      description: <Trans i18nKey="polkadot.manage.nominate.description" />,
      Icon: NominateIcon,
    },
    {
      disabled: !chillEnabled,
      navigationParams: [
        NavigatorName.PolkadotSimpleOperationFlow,
        {
          screen: ScreenName.PolkadotSimpleOperationStarted,
          params: { mode: "chill", accountId },
        },
      ],
      label: <Trans i18nKey="polkadot.manage.chill.title" />,
      description: <Trans i18nKey="polkadot.manage.chill.description" />,
      Icon: ChillIcon,
    },
  ];
};

export default {
  getActions,
};
