import React from "react";
import { Trans } from "react-i18next";
import type { Account } from "@ledgerhq/types-live";
import type { TronAccount } from "@ledgerhq/live-common/families/tron/types";
import { BigNumber } from "bignumber.js";
import {
  MIN_TRANSACTION_AMOUNT,
  getLastVotedDate,
} from "@ledgerhq/live-common/families/tron/react";
import { Icons } from "@ledgerhq/native-ui";
import { NavigatorName, ScreenName } from "../../const";
import { ActionButtonEvent } from "../../components/FabActions";

const getActions = ({
  account,
  parentAccount,
}: {
  account: Account;
  parentAccount: Account;
}): ActionButtonEvent[] | null | undefined => {
  if (!(account as TronAccount).tronResources) return null;
  const {
    spendableBalance,
    tronResources: {
      tronPower,
      frozen: { bandwidth, energy } = {},
      frozen,
    } = {},
  } = account as TronAccount;
  const accountId = account.id;
  const canFreeze =
    spendableBalance && spendableBalance.gt(MIN_TRANSACTION_AMOUNT);
  const timeToUnfreezeBandwidth =
    bandwidth && bandwidth.expiredAt ? +bandwidth.expiredAt : Infinity;
  const timeToUnfreezeEnergy =
    energy && energy.expiredAt ? +energy.expiredAt : Infinity;
  const effectiveTimeToUnfreeze = Math.min(
    timeToUnfreezeBandwidth,
    timeToUnfreezeEnergy,
  );
  const canUnfreeze =
    frozen &&
    BigNumber((bandwidth && bandwidth.amount) || 0)
      .plus((energy && energy.amount) || 0)
      .gt(MIN_TRANSACTION_AMOUNT) &&
    effectiveTimeToUnfreeze < Date.now();
  const canVote = (tronPower || 0) > 0;
  const lastVotedDate = getLastVotedDate(account as TronAccount);
  return [
    {
      id: "stake",
      disabled: !canVote && !canFreeze,
      navigationParams: [
        canVote ? NavigatorName.TronVoteFlow : NavigatorName.Freeze,
        {
          screen: canVote ? ScreenName.VoteStarted : ScreenName.FreezeInfo,
          params: {
            params: {
              accountId,
              parentId: parentAccount?.id,
            },
          },
        },
      ],
      label: <Trans i18nKey="account.stake" />,
      Icon: Icons.ClaimRewardsMedium,
    },
    {
      id: "freeze",
      disabled: !canFreeze,
      navigationParams: [
        NavigatorName.Freeze,
        {
          screen: canVote ? ScreenName.FreezeAmount : ScreenName.FreezeInfo,
          params: {
            accountId,
          },
        },
      ],
      label: <Trans i18nKey="tron.manage.freeze.title" />,
      description: <Trans i18nKey="tron.manage.freeze.description" />,
      Icon: Icons.FreezeMedium,
    },
    {
      id: "unfreeze",
      disabled: !canUnfreeze,
      navigationParams: [
        NavigatorName.Unfreeze,
        {
          screen: ScreenName.UnfreezeAmount,
          params: {
            accountId,
          },
        },
      ],
      label: <Trans i18nKey="tron.manage.unfreeze.title" />,
      description: <Trans i18nKey="tron.manage.unfreeze.description" />,
      Icon: Icons.UnfreezeMedium,
      buttonProps: {
        type: "main",
        outline: false,
      },
    },
    {
      id: "vote",
      disabled: !canVote,
      navigationParams: [
        NavigatorName.TronVoteFlow,
        {
          screen: lastVotedDate ? "VoteSelectValidator" : "VoteStarted",
          params: {
            accountId,
          },
        },
      ],
      label: <Trans i18nKey="tron.manage.vote.title" />,
      description: <Trans i18nKey="tron.manage.vote.description" />,
      Icon: Icons.VoteMedium,
      buttonProps: {
        type: "main",
        outline: false,
      },
    },
  ];
};

export default {
  getActions,
};
