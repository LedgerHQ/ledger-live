import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { openModal } from "~/renderer/actions/modals";
import IconCoins from "~/renderer/icons/Coins";
import { AlgorandFamily } from "./types";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";

const AccountHeaderActions: AlgorandFamily["accountHeaderManageActions"] = ({
  account,
  parentAccount,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const balance = account.balance;
  const unit = useAccountUnit(account);
  const minRewardsBalance = 10 ** unit.magnitude;

  const onClick = useCallback(() => {
    dispatch(openModal("MODAL_ALGORAND_EARN_REWARDS_INFO", { account }));
  }, [dispatch, account]);

  if (parentAccount || balance.gt(minRewardsBalance)) return null;

  return [
    {
      key: "algorand",
      onClick: onClick,
      icon: IconCoins,
      label: t("account.stake"),
      event: "button_clicked2",
      eventProperties: {
        button: "stake",
      },
      accountActionsTestId: "stake-button",
    },
  ];
};

export default AccountHeaderActions;
