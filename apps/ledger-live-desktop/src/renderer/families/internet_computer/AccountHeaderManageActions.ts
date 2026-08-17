import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { canStakeICP } from "@ledgerhq/live-common/families/internet_computer/react";
import type { Transaction } from "@ledgerhq/live-common/families/internet_computer/types";
import { useDispatch } from "LLD/hooks/redux";
import { useStake } from "LLD/hooks/useStake";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useGetStakeLabelLocaleBased } from "~/renderer/hooks/useGetStakeLabelLocaleBased";
import IconCoins from "~/renderer/icons/Coins";
import IconDelegate from "~/renderer/icons/Delegate";
import { ManageAction } from "../types";
import { onClickManageNeurons, onClickStakeIcp } from "./common";
import { InternetComputerFamily } from "./types";

const AccountHeaderManageActions: InternetComputerFamily["accountHeaderManageActions"] = ({
  account,
}) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const stakeLabel = useGetStakeLabelLocaleBased();
  const bridge = useAccountBridge<Transaction>(account);
  const { getCanStakeUsingLedgerLive, getCanStakeUsingPlatformApp } = useStake();
  const icpAccount = account.type === "Account" ? account : undefined;

  const onStake = useCallback(() => {
    if (icpAccount) onClickStakeIcp(dispatch, icpAccount, bridge);
  }, [dispatch, icpAccount, bridge]);

  const onManage = useCallback(() => {
    if (icpAccount) onClickManageNeurons(dispatch, icpAccount);
  }, [dispatch, icpAccount]);

  if (!icpAccount) return null;

  // Mirrors the gate AccountHeaderActions puts on "Stake": a platform-app redirect means staking
  // happens in the partner app, not here.
  const { id: currencyId } = icpAccount.currency;
  if (!getCanStakeUsingLedgerLive(currencyId) || getCanStakeUsingPlatformApp(currencyId)) {
    return null;
  }

  const actions: ManageAction[] = [];

  if (canStakeICP(icpAccount)) {
    actions.push({
      key: "Stake",
      onClick: onStake,
      icon: IconCoins,
      label: stakeLabel,
      event: "button_clicked2",
      eventProperties: { button: "stake" },
      accountActionsTestId: "stake-button",
    });
  }

  // Not gated on the neuron count: neurons only arrive via a device-signed list_neurons, whose Sync
  // button lives inside the modal this opens. The list step renders its own empty state.
  actions.push({
    key: "ManageNeurons",
    onClick: onManage,
    icon: IconDelegate,
    label: t("internetComputer.headerManageActions.manageNeurons.title"),
    event: "button_clicked2",
    eventProperties: { button: "manage_neurons" },
    accountActionsTestId: "manage-neurons-button",
  });

  return actions;
};

export default AccountHeaderManageActions;
