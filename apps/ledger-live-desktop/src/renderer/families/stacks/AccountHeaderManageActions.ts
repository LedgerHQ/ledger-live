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
  // record for the address (true for both "active" and "deactivating" -- get-staker-info only goes
  // to none once the lock period fully elapses) -- so Stake must stay hidden for any existing
  // position, not just an active one.
  //
  // Unstake follows `stakingPosition.actions` rather than re-deriving its own "active" check on
  // `state`: `state` is itself a heuristic (getStakes.ts's own comment: it can't distinguish a stake
  // in its natural final "deactivating" cycle from a full-term stake that already called `unstake`
  // but hasn't reached that cycle yet), and `actions` is the one place that assumption is already
  // decided, authoritatively, by the API layer. Deriving a second, independent "active" check here
  // would duplicate that same uncertain assumption instead of just reading its outcome -- if the
  // heuristic or its mapping to `actions` ever changes, this follows it automatically.
  //
  // `stakingPositions` is omitted (not `[]`) when the lookup itself failed -- see
  // synchronization.ts's getAccountShape -- so `!stakingPosition` alone can't tell "no position"
  // apart from "position unknown". Gate on the key's presence too, so a transient lookup failure
  // hides Stake instead of wrongly re-exposing it.
  const canStake = account.stakingPositions !== undefined && !stakingPosition;
  const canUnstake = !!stakingPosition?.actions?.includes("undelegate");

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
