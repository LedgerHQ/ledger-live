import { getMainAccount, isAccountEmpty } from "@ledgerhq/live-common/account/index";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import IconCoins from "~/renderer/icons/Coins";
import { SolanaFamily } from "./types";
import { useGetStakeLabelLocaleBased } from "~/renderer/hooks/useGetStakeLabelLocaleBased";

const AccountHeaderActions: SolanaFamily["accountHeaderManageActions"] = ({
  account,
  parentAccount,
  source,
}) => {
  const dispatch = useDispatch();
  const label = useGetStakeLabelLocaleBased();
  const mainAccount = getMainAccount(account, parentAccount);
  const { solanaResources } = mainAccount;

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
          solanaResources && solanaResources.stakes.length > 0
            ? "MODAL_SOLANA_DELEGATE"
            : "MODAL_SOLANA_REWARDS_INFO",
          {
            account: mainAccount,
            source,
          },
        ),
      );
    }
  }, [account, dispatch, source, solanaResources, mainAccount]);

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
