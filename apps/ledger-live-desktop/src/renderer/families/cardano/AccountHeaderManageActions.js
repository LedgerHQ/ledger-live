// @flow
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import invariant from "invariant";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import IconCoins from "~/renderer/icons/Coins";

type Props = {
  account: AccountLike,
  parentAccount: ?Account,
};

const AccountHeaderActions = ({ account, parentAccount }: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const mainAccount = getMainAccount(account, parentAccount);

  const { cardanoResources } = mainAccount;
  invariant(cardanoResources, "cardano account expected");
  const disableStakeButton = cardanoResources.delegation.poolId || mainAccount.balance.isZero();
  const disabledLabel = cardanoResources.delegation
    ? "You have already delegated to a pool"
    : mainAccount.balance.isZero()
    ? "Add Funds to stake"
    : "";

  const onClick = useCallback(() => {
    dispatch(
      openModal("MODAL_CARDANO_DELEGATE", {
        account,
      }),
    );
  }, [dispatch, account]);

  if (parentAccount) return null;

  return [
    {
      key: "Stake",
      onClick: onClick,
      icon: IconCoins,
      disabled: disableStakeButton,
      label: t("account.stake"),
      tooltip: disabledLabel,
    },
  ];
};

export default AccountHeaderActions;
