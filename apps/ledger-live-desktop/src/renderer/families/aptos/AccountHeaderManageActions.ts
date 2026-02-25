import { getMainAccount } from "@ledgerhq/live-common/account/helpers";
import { canStake } from "@ledgerhq/live-common/families/aptos/staking";
import { useCallback } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { openModal } from "~/renderer/actions/modals";
import IconCoins from "~/renderer/icons/Coins";
import { AptosFamily } from "./types";
import { useGetStakeLabelLocaleBased } from "~/renderer/hooks/useGetStakeLabelLocaleBased";

const AccountHeaderActions: AptosFamily["accountHeaderManageActions"] = ({
  account,
  parentAccount,
  source,
}) => {
  const dispatch = useDispatch();
  const label = useGetStakeLabelLocaleBased();
  const mainAccount = getMainAccount(account, parentAccount);
  const { aptosResources } = mainAccount;
  const stakingEnabled = canStake(mainAccount);
  const hasStakingPositions = (aptosResources?.stakingPositions?.length ?? 0) > 0;

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
          openModal("MODAL_APTOS_STAKE", {
            account: mainAccount,
            source,
          }),
        );
      } else {
        dispatch(
          openModal("MODAL_APTOS_REWARDS_INFO", {
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
