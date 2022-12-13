// @flow
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import IconCoins from "~/renderer/icons/ClaimReward";
import { openModal } from "~/renderer/actions/modals";
type Props = {
  account: AccountLike,
  parentAccount: ?Account,
};

const AccountHeaderActions = ({ account, parentAccount }: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const onClick = useCallback(() => {
    dispatch(
      openModal("MODAL_ETH_STAKE", {
        account,
      }),
    );
  }, [dispatch, account]);

  if (account.type === "Account") {
    return [
      {
        key: "Stake",
        onClick,
        event: "Eth Stake Account Button",
        icon: IconCoins,
        label: t("account.stake", { currency: account?.currency?.name }),
      },
    ];
  } else {
    return [];
  }
};

export default AccountHeaderActions;
