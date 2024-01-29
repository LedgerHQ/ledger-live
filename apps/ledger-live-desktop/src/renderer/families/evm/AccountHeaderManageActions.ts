import { Account, AccountLike } from "@ledgerhq/types-live";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import IconCoins from "~/renderer/icons/Coins";
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
    } else if (account.type === "Account") {
      dispatch(
        openModal("MODAL_EVM_STAKE", {
          account,
        }),
      );
    }
  }, [account, dispatch, parentAccount]);

  if (account.type === "Account" && account.currency.id.includes("ethereum")) {
    return [
      {
        key: "Stake",
        onClick,
        event: "button_clicked2",
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
