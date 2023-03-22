// @flow

import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { STAKE_TYPE } from "@ledgerhq/live-common/families/hedera/types";

import IconCoins from "~/renderer/icons/Coins";
import { openModal } from "~/renderer/actions/modals";

import type { Account, AccountLike } from "@ledgerhq/types-live";

type Props = {
  account: AccountLike,
  parentAccount: ?Account,
};

const AccountHeaderManageActionsComponent = ({ account, parentAccount }: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const mainAccount = getMainAccount(account, parentAccount);
  const { hederaResources, pendingOperations, operations: confirmedOperations } = mainAccount;

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
    allOpsConfirmed = confirmedOperations.some(confirmedOp => pendingOp.id === confirmedOp.id);

    if (!allOpsConfirmed) break;
  }

  // open 'set new stake' modal
  const onStake = useCallback(() => {
    const data = { account: mainAccount, stakeType: STAKE_TYPE.NEW };
    dispatch(openModal("MODAL_HEDERA_STAKE", data));
  }, [dispatch, mainAccount]);

  // open 'change staked to' modal
  const onChangeStakedTo = useCallback(() => {
    const data = { account: mainAccount, stakeType: STAKE_TYPE.CHANGE };
    dispatch(openModal("MODAL_HEDERA_STAKE", data));
  }, [dispatch, mainAccount]);

  // open 'stop staking (confirmation)' modal
  const onStopStaking = useCallback(() => {
    const data = { account: mainAccount, stakeType: STAKE_TYPE.STOP };
    dispatch(openModal("MODAL_HEDERA_STOP_STAKING", data));
  }, [dispatch, mainAccount]);

  const stakeAction = {
    key: "Stake",
    onClick: onStake,
    icon: IconCoins,
    label: t("hedera.stake.stepperHeader.stake"),
    disabled: !allOpsConfirmed,
  };
  const changeStakedToAction = {
    key: "ChangeStakedTo",
    onClick: onChangeStakedTo,
    icon: IconCoins,
    label: t("hedera.stake.stepperHeader.changeStake"),
    disabled: !allOpsConfirmed,
  };
  const stopStakingAction = {
    key: "StopStaking",
    onClick: onStopStaking,
    icon: IconCoins,
    label: t("hedera.stake.stepperHeader.stopStake"),
    disabled: !allOpsConfirmed,
  };

  // array containing which buttons to show depending on account's staking status
  const actionList = [];

  // if account is already staking to a node or account id,
  // show `Change Staked To and `Stop Staking` buttons
  if (hederaResources?.staked?.stakeMethod != null) {
    actionList.push(changeStakedToAction, stopStakingAction);
  } else {
    // otherwise, show `Stake` button
    actionList.push(stakeAction);
  }

  if (parentAccount) return null;

  return actionList;
};

const AccountHeaderManageActions = ({ account, parentAccount }: Props) => {
  return AccountHeaderManageActionsComponent({ account, parentAccount });
};

export default AccountHeaderManageActions;