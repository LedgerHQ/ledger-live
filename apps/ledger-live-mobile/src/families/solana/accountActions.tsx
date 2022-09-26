import React from "react";
import type { Account } from "@ledgerhq/types-live";
import { Icons } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";
import { SolanaAccount } from "@ledgerhq/live-common/lib/families/solana/types";
import { NavigatorName, ScreenName } from "../../const";

const getActions = ({
  account,
  parentAccount,
}: {
  account: SolanaAccount;
  parentAccount: Account;
}) => {
  const delegationDisabled = account.solanaResources?.stakes.length > 1;

  return [
    {
      id: "stake",
      disabled: delegationDisabled,
      navigationParams: [
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
      ],
      label: <Trans i18nKey="account.stake" />,
      Icon: Icons.ClaimRewardsMedium,
    },
  ];
};

export default {
  getActions,
};
