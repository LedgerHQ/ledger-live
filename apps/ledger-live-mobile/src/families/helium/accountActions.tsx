import React from "react";
import type { Account } from "@ledgerhq/types-live";
import { Trans } from "react-i18next";
import { HeliumAccount } from "@ledgerhq/live-common/lib/families/helium/types";
import Votes from "../../icons/Vote";
import { NavigatorName, ScreenName } from "../../const";

const getActions = ({
  account,
  parentAccount,
}: {
  account: HeliumAccount;
  parentAccount: Account;
}) => {
  return [
    {
      navigationParams: [
        NavigatorName.HeliumVoteFlow,
        {
          screen: ScreenName.HeliumVoteStarted,
          params: {
            accountId: account.id,
            parentId: parentAccount ? parentAccount.id : undefined,
          },
        },
      ],
      label: <Trans i18nKey="account.vote" />,
      Icon: Votes,
    },
  ];
};

export default {
  getActions,
};
