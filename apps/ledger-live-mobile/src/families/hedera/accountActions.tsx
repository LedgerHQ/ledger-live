import React from "react";
import { Trans } from "react-i18next";
import { Icons } from "@ledgerhq/native-ui";
import {
  HederaAccount,
  STAKE_TYPE,
} from "@ledgerhq/live-common/families/hedera/types";

import { NavigatorName, ScreenName } from "../../const";

const getActions = ({ account }: { account: HederaAccount }) => {
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
  let allOpsConfirmed = true;
  for (const pendingOp of pendingOperations) {
    allOpsConfirmed = confirmedOperations.some(
      confirmedOp => pendingOp.id === confirmedOp.id,
    );

    if (!allOpsConfirmed) break;
  }

  const stakeAction = {
    navigationParams: [
      NavigatorName.HederaStakeFlow,
      {
        screen: ScreenName.HederaStakeForm,
        params: { stakeType: STAKE_TYPE.NEW },
      },
    ],
    icon: Icons.ClaimRewardsMedium,
    label: <Trans i18nKey="hedera.stake.stepperHeader.stake" />,
    disabled: !allOpsConfirmed,
  };
  const changeStakedToAction = {
    navigationParams: [
      NavigatorName.HederaStakeFlow,
      {
        screen: ScreenName.HederaStakeForm,
        params: { stakeType: STAKE_TYPE.CHANGE },
      },
    ],
    icon: Icons.ClaimRewardsMedium,
    label: <Trans i18nKey="hedera.stake.stepperHeader.changeStake" />,
    disabled: !allOpsConfirmed,
  };
  const stopStakingAction = {
    navigationParams: [
      NavigatorName.HederaStopStakeFlow,
      {
        screen: ScreenName.HederaStakeStopConfirmation,
        params: { stakeType: STAKE_TYPE.STOP },
      },
    ],
    icon: Icons.ClaimRewardsMedium,
    label: <Trans i18nKey="hedera.stake.stepperHeader.stopStake" />,
    disabled: !allOpsConfirmed,
  };

  // array containing which buttons to show depending on account's staking status
  const actionList = [];

  // if account is already staking to a node or account id,
  // show `Change Stake` and `Stop Stake` buttons
  if (hederaResources?.staked?.stakeMethod != null) {
    actionList.push(stopStakingAction, changeStakedToAction);
  } else {
    // otherwise, show `Stake` button
    actionList.push(stakeAction);
  }

  return actionList;
};

export default {
  getActions,
};
