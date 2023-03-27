import React from "react";
import type { Account } from "@ledgerhq/types-live";
import { Icons } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";
import { SolanaAccount } from "@ledgerhq/live-common/families/solana/types";
import { NavigatorName, ScreenName } from "../../const";

const getMainActions = ({
  account,
  parentAccount,
}: {
  account: SolanaAccount;
  parentAccount: Account;
}) => {
  const delegationDisabled = account.solanaResources?.stakes.length > 1;

  const navigationParams = delegationDisabled
    ? [
        NavigatorName.NoFundsFlow,
        {
          screen: ScreenName.NoFunds,
          params: {
            account,
            parentAccount,
          },
        },
      ]
    : [
        NavigatorName.SolanaDelegationFlow,
        {
          screen: ScreenName.SolanaDelegationStarted,
          params: {
            accountId: account.id,
            parentId: parentAccount ? parentAccount.id : undefined,
            delegationAction: {
              kind: "new",
            },
          },
        },
      ];

  return [
    {
      id: "stake",
      navigationParams,
      label: <Trans i18nKey="account.stake" />,
      Icon: Icons.ClaimRewardsMedium,
      event: "button_clicked",
      eventProperties: {
        button: "stake",
        token: "SOL",
        page: "Account Page",
      },
    },
  ];
};

export default {
  getMainActions,
};
