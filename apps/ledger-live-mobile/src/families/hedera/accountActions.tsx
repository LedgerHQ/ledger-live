import React from "react";
import { Trans } from "react-i18next";
import { Icons } from "@ledgerhq/native-ui";
import {
  HederaAccount,
  STAKE_TYPE,
} from "@ledgerhq/live-common/families/hedera/types";
import type { Account } from "@ledgerhq/types-live";

import { NavigatorName, ScreenName } from "../../const";

const getMainActions = ({
  account,
  parentAccount,
}: {
  account: HederaAccount;
  parentAccount: Account;
}) => {
  const {
    hederaResources,
    pendingOperations,
    operations: confirmedOperations,
  } = account;

  // NOTE: this is a temporary work-around ideally until
  // confirmed operations in `mainAccount.pendingOperations`
  // is removed automatically via core LLC (unless this needs
  // to be a specific family LLC implementation)
  // const allOpsConfirmed = mainAccount.pendingOperations.length === 0;
  //
  // Check for whether any pending operation does not exist
  // in list of confirmed operations (implying that the pending operation
  // isn't confirmed yet)
  // let allOpsConfirmed = true;
  // for (const pendingOp of pendingOperations) {
  //   allOpsConfirmed = confirmedOperations.some(
  //     confirmedOp => pendingOp.id === confirmedOp.id,
  //   );

  //   if (!allOpsConfirmed) break;
  // }

  const navigationParams = [
    NavigatorName.HederaStakeFlow,
    {
      screen: ScreenName.HederaStakingStarted,
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
        currency: "HEDERA",
        page: "Account Page",
      },
    },
  ];
};

export default {
  getMainActions,
};
