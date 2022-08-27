// @flow
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import type { Account, AccountLike } from "@ledgerhq/live-common/types/index";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import Vote from "~/renderer/icons/Vote";

type Props = {
  account: AccountLike,
  parentAccount: ?Account,
};

const AccountHeaderActions = ({ account, parentAccount }: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const onClick = useCallback(
    mode => {
      if (mode === "vote") {
        dispatch(
          openModal("MODAL_HELIUM_VOTE_INFO", {
            account,
          }),
        );
      }
    },
    [dispatch, account],
  );

  const addtionalActions = [];

  if (account.currency.id === "helium" || account.currency.id === "helium_testnet") {
    addtionalActions.push({
      key: "helium-votes",
      onClick: () => onClick("vote"),
      icon: Vote,
      label: t("account.vote"),
    });
  }

  return addtionalActions;
};

export default AccountHeaderActions;
