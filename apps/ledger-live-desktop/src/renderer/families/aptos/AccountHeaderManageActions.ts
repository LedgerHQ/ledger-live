import { getMainAccount, isAccountEmpty } from "@ledgerhq/live-common/account/index";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
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

  const onClick = useCallback(() => {
    if (isAccountEmpty(account)) {
      dispatch(
        openModal("MODAL_NO_FUNDS_STAKE", {
          account,
        }),
      );
    } else {
      dispatch(
        openModal(
          aptosResources && aptosResources.stakes.length > 0
            ? "MODAL_APTOS_DELEGATE"
            : "MODAL_APTOS_REWARDS_INFO",
          {
            account: mainAccount,
            source,
          },
        ),
      );
    }
  }, [account, dispatch, source, aptosResources, mainAccount]);

  if (account.type === "TokenAccount") {
    return null;
  }

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
