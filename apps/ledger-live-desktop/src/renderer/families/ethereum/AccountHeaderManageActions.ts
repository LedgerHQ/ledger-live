import { Account, AccountLike } from "@ledgerhq/types-live";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import IconCoins from "~/renderer/icons/ClaimReward";
import { openModal } from "~/renderer/actions/modals";
import { isAccountEmpty } from "@ledgerhq/live-common/account/index";
type Props = {
  account: AccountLike;
  parentAccount: Account | undefined | null;
};
const AccountHeaderActions = ({ account, parentAccount }: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const onClick = useCallback(() => {
    if (isAccountEmpty(account)) {
      dispatch(
        openModal("MODAL_NO_FUNDS_STAKE", {
          account,
          parentAccount,
        }),
      );
    } else {
      dispatch(
        openModal("MODAL_ETH_STAKE", {
          account,
        }),
      );
    }
  }, [account, dispatch, parentAccount]);
  if (account.type === "Account" && account.currency.id === "ethereum") {
    return [
      {
        key: "Stake",
        onClick,
        event: "button_clicked",
        eventProperties: {
          button: "stake",
        },
        icon: IconCoins,
        label: t("account.stake", {
          currency: account?.currency?.name,
        }),
        accountActionsTestId: "stake-from-account-action-button",
      },
    ];
  } else {
    return [];
  }
};
export default AccountHeaderActions;
