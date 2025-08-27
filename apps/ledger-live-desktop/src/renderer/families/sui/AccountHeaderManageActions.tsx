import IconCoins from "~/renderer/icons/Coins";
import { isAccountEmpty } from "@ledgerhq/live-common/account/index";
import { openModal } from "~/renderer/actions/modals";
import { useGetStakeLabelLocaleBased } from "~/renderer/hooks/useGetStakeLabelLocaleBased";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { SuiAccount } from "@ledgerhq/live-common/families/sui/types";

const AccountHeaderActions = ({ account }: { account: SuiAccount }) => {
  const label = useGetStakeLabelLocaleBased();
  const dispatch = useDispatch();

  const onClick = useCallback(() => {
    if (isAccountEmpty(account)) {
      dispatch(
        openModal("MODAL_NO_FUNDS_STAKE", {
          account,
        }),
      );
    } else {
      dispatch(
        openModal("MODAL_SUI_DELEGATE", {
          account,
        }),
      );
    }
  }, [account, dispatch]);

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
