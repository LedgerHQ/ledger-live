import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { CardanoAccount } from "@ledgerhq/live-common/families/cardano/types";
import { Account, AccountLike } from "@ledgerhq/types-live";
import invariant from "invariant";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import IconCoins from "~/renderer/icons/Coins";

type Props = {
  account: AccountLike;
  parentAccount: Account | undefined | null;
};

const AccountHeaderActions = ({ account, parentAccount }: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const mainAccount = getMainAccount(account, parentAccount);
  const { cardanoResources } = mainAccount as CardanoAccount;

  invariant(cardanoResources, "cardano account expected");

  const disableStakeButton =
    (cardanoResources.delegation && !!cardanoResources.delegation.poolId) ||
    mainAccount.balance.isZero();

  const disabledLabel =
    cardanoResources.delegation && cardanoResources.delegation.poolId
      ? t("cardano.delegation.assetsAlreadyStaked")
      : mainAccount.balance.isZero()
      ? t("cardano.delegation.addFundsToStake")
      : "";

  const onClick = useCallback(() => {
    dispatch(
      openModal("MODAL_CARDANO_REWARDS_INFO", {
        account: account as CardanoAccount,
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
