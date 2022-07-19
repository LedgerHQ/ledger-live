// @flow
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import type { Account, AccountLike } from "@ledgerhq/live-common/types/index";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import IconCoins from "~/renderer/icons/Coins";
import Vote from "~/renderer/icons/Vote";

type Props = {
  account: AccountLike,
  parentAccount: ?Account,
};

const AccountHeaderActions = ({ account, parentAccount }: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const mainAccount = getMainAccount(account, parentAccount);
  const { heliumResources } = mainAccount;

  const onClick = useCallback(
    mode => {
      if (mode === "stake") {
        dispatch(
          openModal(
            heliumResources && heliumResources.stakes.length > 0
              ? "MODAL_HELIUM_STAKE"
              : "MODAL_HELIUM_REWARDS_INFO",
            {
              account,
            },
          ),
        );
      } else if (mode === "vote") {
        dispatch(
          openModal("MODAL_HELIUM_VOTE_INFO", {
            account,
          }),
        );
      }
    },
    [dispatch, account, heliumResources],
  );

  return [
    {
      key: "helium",
      onClick: () => onClick("stake"),
      icon: IconCoins,
      label: t("account.stake"),
    },
    {
      key: "helium",
      onClick: () => onClick("vote"),
      icon: Vote,
      label: t("account.vote"),
    },
  ];
};

export default AccountHeaderActions;
