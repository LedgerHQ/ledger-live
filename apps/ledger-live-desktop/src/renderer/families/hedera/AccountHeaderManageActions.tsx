import { useDispatch } from "react-redux";
import { isAccountEmpty } from "@ledgerhq/live-common/account/index";
import { openModal } from "~/renderer/actions/modals";
import { useGetStakeLabelLocaleBased } from "~/renderer/hooks/useGetStakeLabelLocaleBased";
import IconCoins from "~/renderer/icons/Coins";
import type { HederaFamily } from "~/renderer/families/hedera/types";

const AccountHeaderActions: HederaFamily["accountHeaderManageActions"] = ({ account }) => {
  const label = useGetStakeLabelLocaleBased();
  const dispatch = useDispatch();

  if (account.type !== "Account") {
    return [];
  }

  const onClick = () => {
    const isAlreadyStaked = !!account.hederaResources?.delegation;

    if (isAccountEmpty(account)) {
      dispatch(openModal("MODAL_NO_FUNDS_STAKE", { account }));
    } else if (isAlreadyStaked) {
      console.log("FIXME: already staked logic");
    } else {
      dispatch(openModal("MODAL_HEDERA_DELEGATE", { account }));
    }
  };

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
