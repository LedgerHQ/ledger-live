import React from "react";
import { Trans } from "react-i18next";
import type { Account } from "@ledgerhq/types-live";
import type { IconAccount } from "@ledgerhq/live-common/families/icon/types";
import {
  MIN_TRANSACTION_AMOUNT,
} from "@ledgerhq/live-common/families/icon/react";
import { Icons } from "@ledgerhq/native-ui";
import { NavigatorName, ScreenName } from "../../const";
import { ActionButtonEvent } from "../../components/FabActions";

const getActions = ({
  account,
}: {
  account: Account;
  parentAccount: Account;
}): ActionButtonEvent[] | null | undefined => {
  if (!(account as IconAccount).iconResources) return null;
  const {
    spendableBalance,
    iconResources: {
      votingPower,
    } = {},
  } = account as IconAccount;
  const accountId = account.id;
  const canFreeze =
    spendableBalance && spendableBalance.gt(MIN_TRANSACTION_AMOUNT);
  const canUnfreeze = Number(votingPower);
  const canVote = (votingPower || 0) > 0;
  return [
    {
      id: "freeze",
      disabled: !canFreeze || Number(votingPower) > 0,
      navigationParams: [
        NavigatorName.IconFreezeFlow,
        {
          screen: canVote ? ScreenName.IconFreezeAmount : ScreenName.IconFreezeInfo,
          params: {
            accountId,
          },
        },
      ],
      label: <Trans i18nKey="icon.manage.freeze.title" />,
      description: <Trans i18nKey="icon.manage.freeze.description" />,
      Icon: Icons.FreezeMedium,
    },
    {
      id: "unfreeze",
      disabled: !canUnfreeze,
      navigationParams: [
        NavigatorName.IconUnfreezeFlow,
        {
          screen: ScreenName.IconUnfreezeAmount,
          params: {
            accountId,
          },
        },
      ],
      label: <Trans i18nKey="icon.manage.unfreeze.title" />,
      description: <Trans i18nKey="icon.manage.unfreeze.description" />,
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
        NavigatorName.IconVoteFlow,
        {
          screen: votingPower ? ScreenName.IconVoteSelectValidator : ScreenName.IconVoteStarted,
          params: {
            accountId,
          },
        },
      ],
      label: <Trans i18nKey="icon.manage.vote.title" />,
      description: <Trans i18nKey="icon.manage.vote.description" />,
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
