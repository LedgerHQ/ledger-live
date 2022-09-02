// @flow

import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";

import type { Account, AccountLike } from "@ledgerhq/types-live";
import { getAccountUnit } from "@ledgerhq/live-common/account/helpers";

import { openModal } from "~/renderer/actions/modals";
import IconCoins from "~/renderer/icons/Coins";

type Props = {
  account: AccountLike,
  parentAccount: ?Account,
};

const AccountHeaderActions = ({ account, parentAccount }: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const balance = account.balance;
  const unit = getAccountUnit(account);
  const minRewardsBalance = 10 ** unit.magnitude;

  const onClick = useCallback(() => {
    dispatch(
      openModal("MODAL_ALGORAND_EARN_REWARDS_INFO", {
        account,
      }),
    );
  }, [dispatch, account]);

  if (parentAccount || balance.gt(minRewardsBalance)) return null;

  return [
    {
      key: "algorand",
      onClick: onClick,
      icon: IconCoins,
      label: t("account.stake"),
    },
  ];
};

export default AccountHeaderActions;
