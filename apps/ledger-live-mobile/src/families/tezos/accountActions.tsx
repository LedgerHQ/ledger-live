import React from "react";
import { Trans } from "react-i18next";
import type { AccountLike } from "@ledgerhq/live-common/types/index";
import { getAccountDelegationSync, isAccountDelegating } from "@ledgerhq/live-common/families/tezos/bakers";
import { Account } from "@ledgerhq/live-common/types/index";
import { Icons } from "@ledgerhq/native-ui";
import { NavigatorName, ScreenName } from "../../const";

const getExtraSendActionParams = ({ account }: { account: AccountLike }) => {
  const delegation = getAccountDelegationSync(account);
  const sendShouldWarnDelegation =
    delegation && delegation.sendShouldWarnDelegation;

  return sendShouldWarnDelegation
    ? {
        confirmModalProps: {
          withCancel: true,
          id: "TezosDelegateSendWarning",
          desc: <Trans i18nKey="delegation.delegationSendWarnDesc" />,
        },
      }
    : {};
};

const getExtraReceiveActionParams = ({ account }: { account: AccountLike }) => {
  const delegation = getAccountDelegationSync(account);
  const sendShouldWarnDelegation =
    delegation && delegation.receiveShouldWarnDelegation;

  return sendShouldWarnDelegation
    ? {
        confirmModalProps: {
          withCancel: true,
          id: "TezosDelegateReceiveWarning",
          desc: <Trans i18nKey="delegation.delegationReceiveWarnDesc" />,
        },
      }
    : {};
};

const getActions = ({ account, parentAccount }: { account: Account,  parentAccount: Account }) => {
  const delegationDisabled = (isAccountDelegating(account) || account.type !== "Account");

  return [
    {
      disabled: delegationDisabled,
      navigationParams: [
        NavigatorName.TezosDelegationFlow,
        {
          screen: ScreenName.DelegationStarted,
          params: {
            accountId: account.id,
            parentId: parentAccount ? parentAccount.id : undefined,
          },
        },
      ],
      label: <Trans i18nKey="account.stake" />,
      Icon: Icons.ClaimRewardsMedium,
    },
  ];
};

export default {
  getExtraSendActionParams,
  getExtraReceiveActionParams,
  getActions
};
