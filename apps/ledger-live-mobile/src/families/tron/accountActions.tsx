import React from "react";
import { Trans } from "react-i18next";
import type { Account } from "@ledgerhq/types-live";
import type { TronAccount } from "@ledgerhq/live-common/families/tron/types";
import { getLastVotedDate } from "@ledgerhq/live-common/families/tron/react";
import { Icons } from "@ledgerhq/native-ui";
import { NavigatorName, ScreenName } from "../../const";
import { ActionButtonEvent } from "../../components/FabActions";

const getSecondaryActions = ({
  account,
}: {
  account: Account;
  parentAccount: Account;
}): ActionButtonEvent[] | null | undefined => {
  if (!(account as TronAccount).tronResources) return null;
  const { tronResources: { tronPower } = {} } = account as TronAccount;
  const accountId = account.id;
  const canVote = (tronPower || 0) > 0;
  const lastVotedDate = getLastVotedDate(account as TronAccount);

  return [
    {
      id: "freeze",
      disabled: true,
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
      disabled: true,
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
      disabled: true,
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
  getSecondaryActions,
};
