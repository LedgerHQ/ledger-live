import React from "react";
import { Trans } from "react-i18next";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import {
  getAccountDelegationSync,
  isAccountDelegating,
} from "@ledgerhq/live-common/families/tezos/bakers";
import { ParamListBase, RouteProp } from "@react-navigation/native";
import { IconsLegacy } from "@ledgerhq/native-ui";
import { NavigatorName, ScreenName } from "~/const";
import { ActionButtonEvent, NavigationParamsType } from "~/components/FabActions";

const getExtraSendActionParams = ({ account }: { account: AccountLike }) => {
  const delegation = getAccountDelegationSync(account);
  const sendShouldWarnDelegation = delegation && delegation.sendShouldWarnDelegation;

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
  const sendShouldWarnDelegation = delegation && delegation.receiveShouldWarnDelegation;

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

const getMainActions = ({
  account,
  parentAccount,
  parentRoute,
}: {
  account: Account;
  parentAccount: Account;
  parentRoute?: RouteProp<ParamListBase, ScreenName>;
}): ActionButtonEvent[] => {
  const delegationDisabled = isAccountDelegating(account) || account.type !== "Account";
  const navigationParams: NavigationParamsType = delegationDisabled
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
        NavigatorName.TezosDelegationFlow,
        {
          screen: ScreenName.DelegationStarted,
          params: {
            accountId: account.id,
            parentId: parentAccount ? parentAccount.id : undefined,
            source: parentRoute,
          },
        },
      ];

  return [
    {
      id: "stake",
      navigationParams,
      label: <Trans i18nKey="account.stake" />,
      Icon: IconsLegacy.CoinsMedium,
      event: "button_clicked",
      eventProperties: {
        button: "stake",
        currency: "XTZ",
        page: "Account Page",
      },
    },
  ];
};

export default {
  getExtraSendActionParams,
  getExtraReceiveActionParams,
  getMainActions,
};
