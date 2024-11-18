import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import IconCoins from "~/renderer/icons/Coins";
import { AlgorandFamily } from "./types";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { useGetStakeLabelLocaleBased } from "~/renderer/hooks/useGetStakeLabelLocaleBased";

const AccountHeaderActions: AlgorandFamily["accountHeaderManageActions"] = ({
  account,
  parentAccount,
}) => {
  const dispatch = useDispatch();
  const balance = account.balance;
  const unit = useAccountUnit(account);
  const minRewardsBalance = 10 ** unit.magnitude;

  const label = useGetStakeLabelLocaleBased();

  const onClick = useCallback(() => {
    dispatch(openModal("MODAL_ALGORAND_EARN_REWARDS_INFO", { account }));
  }, [dispatch, account]);

  if (parentAccount || balance.gt(minRewardsBalance)) return null;

  return [
    {
      key: "algorand",
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
