import { getMainAccount, isAccountEmpty } from "@ledgerhq/live-common/account/index";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import IconCoins from "~/renderer/icons/Coins";
import { SolanaFamily } from "./types";

const AccountHeaderActions: SolanaFamily["accountHeaderManageActions"] = ({ account, source }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const mainAccount = getMainAccount(account);
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

  return [
    {
      key: "Stake",
      onClick: onClick,
      icon: IconCoins,
      label: t("account.stake"),
      event: "button_clicked2",
      eventProperties: {
        button: "stake",
      },
    },
  ];
};

export default AccountHeaderActions;
