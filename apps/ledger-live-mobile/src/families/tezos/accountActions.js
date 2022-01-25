// @flow
import React from "react";
import { Trans } from "react-i18next";
import type { AccountLike } from "@ledgerhq/live-common/lib/types";
import { getAccountDelegationSync } from "@ledgerhq/live-common/lib/families/tezos/bakers";

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

export default {
  getExtraSendActionParams,
  getExtraReceiveActionParams,
};
