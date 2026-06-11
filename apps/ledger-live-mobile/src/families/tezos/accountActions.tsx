import React from "react";
import { Trans } from "~/context/Locale";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import {
  getAccountDelegationSync,
  isAccountDelegating,
} from "@ledgerhq/live-common/families/tezos/staking";
import { getTezosEarnFlow } from "@ledgerhq/live-common/families/tezos/earnFlow";
import { defaultIsAccountEmpty } from "@ledgerhq/live-common/bridge/defaultBridgeExtensions";
import { ParamListBase, RouteProp } from "@react-navigation/native";
import { IconsLegacy } from "@ledgerhq/native-ui";
import { NavigatorName, ScreenName } from "~/const";
import { ActionButtonEvent, NavigationParamsType } from "~/components/FabActions";
import { getStakeLabelLocaleBased } from "~/helpers/getStakeLabelLocaleBased";

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
  llmTezosStaking,
}: {
  account: Account;
  parentAccount: Account;
  parentRoute?: RouteProp<ParamListBase, ScreenName>;
  llmTezosStaking?: { enabled?: boolean } | null;
}): ActionButtonEvent[] => {
  const label = getStakeLabelLocaleBased();

  const flow = getTezosEarnFlow({
    isEmpty: account.type !== "Account" || defaultIsAccountEmpty(account),
    stakingEnabled: !!llmTezosStaking?.enabled,
    isDelegated: isAccountDelegating(account),
  });

  const earnParams = {
    accountId: account.id,
    parentId: parentAccount ? parentAccount.id : undefined,
    source: parentRoute,
  };

  let navigationParams: NavigationParamsType;
  switch (flow.kind) {
    case "no-funds":
      navigationParams = [
        NavigatorName.NoFundsFlow,
        { screen: ScreenName.NoFunds, params: { account, parentAccount } },
      ];
      break;
    case "earning-choice":
      navigationParams = [
        NavigatorName.TezosDelegationFlow,
        { screen: ScreenName.TezosEarnRewards, params: earnParams },
      ];
      break;
    case "stake":
      navigationParams = [
        NavigatorName.TezosStakeFlow,
        { screen: ScreenName.TezosStakeAmount, params: earnParams },
      ];
      break;
    case "delegate":
      navigationParams = [
        NavigatorName.TezosDelegationFlow,
        {
          screen: flow.redelegate ? ScreenName.DelegationSummary : ScreenName.DelegationStarted,
          params: earnParams,
        },
      ];
      break;
  }

  return [
    {
      id: "stake",
      navigationParams,
      label: <Trans i18nKey={label} />,
      Icon: IconsLegacy.CoinsMedium,
      eventProperties: {
        currency: "XTZ",
      },
    },
  ];
};

export default {
  getExtraSendActionParams,
  getExtraReceiveActionParams,
  getMainActions,
};
