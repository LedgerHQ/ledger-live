import { getMainAccount } from "@ledgerhq/live-common/account/helpers";
import { canStake } from "@ledgerhq/live-common/families/near/logic";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import IconCoins from "~/renderer/icons/Coins";
import { NearFamily } from "./types";
import { useGetStakeLabelLocaleBased } from "~/renderer/hooks/useGetStakeLabelLocaleBased";

const AccountHeaderActions: NearFamily["accountHeaderManageActions"] = ({
  account,
  parentAccount,
  source,
}) => {
  const dispatch = useDispatch();
  const label = useGetStakeLabelLocaleBased();
  const mainAccount = getMainAccount(account, parentAccount);
  const { nearResources } = mainAccount;
  const stakingEnabled = canStake(mainAccount);
  const hasStakingPositions = nearResources.stakingPositions.length > 0;

  const onClick = useCallback(() => {
    if (!stakingEnabled) {
      dispatch(
        openModal("MODAL_NO_FUNDS_STAKE", {
          account,
          parentAccount,
        }),
      );
    } else {
      if (hasStakingPositions) {
        dispatch(
          openModal("MODAL_NEAR_STAKE", {
            account: mainAccount,
            source,
          }),
        );
      } else {
        dispatch(
          openModal("MODAL_NEAR_REWARDS_INFO", {
            account: mainAccount,
          }),
        );
      }
    }
  }, [stakingEnabled, dispatch, account, mainAccount, parentAccount, hasStakingPositions, source]);

  if (parentAccount) return null;

  return [
    {
      key: "Stake",
      onClick: onClick,
      icon: IconCoins,
      label,
      event: "button_clicked2",
      eventProperties: {
        button: "stake",
      },
      accountActionsTestId: "stake-button",
    },
  ];
};

export default AccountHeaderActions;
