import { getStacksStakingPosition } from "@ledgerhq/live-common/families/stacks/react";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "LLD/hooks/redux";
import { openModal } from "~/renderer/actions/modals";
import IconCoins from "~/renderer/icons/Coins";
import { useGetStakeLabelLocaleBased } from "~/renderer/hooks/useGetStakeLabelLocaleBased";
import { StacksFamily } from "./types";

const AccountHeaderManageActions: StacksFamily["accountHeaderManageActions"] = ({
  account,
  parentAccount,
  source,
}) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const label = useGetStakeLabelLocaleBased();

  const onStakeClick = useCallback(() => {
    if (account.type !== "Account") return;
    dispatch(openModal("MODAL_STACKS_STAKE", { account, source }));
  }, [account, dispatch, source]);

  const onUnstakeClick = useCallback(() => {
    if (account.type !== "Account") return;
    dispatch(openModal("MODAL_STACKS_UNSTAKE", { account, source }));
  }, [account, dispatch, source]);

  if (parentAccount) return null;
  if (account.type !== "Account") return null;

  const stakingPosition = getStacksStakingPosition(account);
  // pox-5's `stake` aborts with ERR_ALREADY_STAKED as long as `get-staker-info` still returns a
  // record for the address -- true for both "active" and "deactivating" (get-staker-info only goes
  // to none once the lock period fully elapses, per getStakes.ts) -- so Stake must stay hidden for
  // any existing position, not just an active one. `getStakes` only sets `actions: ["undelegate"]`
  // while the position is "active"; once it enters "deactivating" (its final reward cycle) a fresh
  // `unstake` call is redundant/invalid too -- so a "deactivating" position shows neither action,
  // matching getStakes.ts's own "nothing useful to do once already deactivating" comment.
  const canStake = !stakingPosition;
  const canUnstake = stakingPosition?.state === "active";

  return [
    ...(canStake
      ? [
          {
            key: "Stake",
            onClick: onStakeClick,
            icon: IconCoins,
            label,
            event: "button_clicked2",
            eventProperties: {
              button: "stake",
            },
            accountActionsTestId: "stake-button",
          },
        ]
      : []),
    ...(canUnstake
      ? [
          {
            key: "Unstake",
            onClick: onUnstakeClick,
            icon: IconCoins,
            label: t("stacks.unstake.flow.title"),
            event: "button_clicked2",
            eventProperties: {
              button: "unstake",
            },
            accountActionsTestId: "unstake-button",
          },
        ]
      : []),
  ];
};

export default AccountHeaderManageActions;
