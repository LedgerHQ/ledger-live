import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { CardanoAccount } from "@ledgerhq/live-common/families/cardano/types";
import { canStake, isAlreadyStaking } from "@ledgerhq/live-common/families/cardano/logic";
import { Account, AccountLike } from "@ledgerhq/types-live";
import invariant from "invariant";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import IconCoins from "~/renderer/icons/Coins";
import { useGetStakeLabelLocaleBased } from "~/renderer/hooks/useGetStakeLabelLocaleBased";

type Props = {
  account: AccountLike;
  parentAccount: Account | undefined | null;
};

const AccountHeaderActions = ({ account, parentAccount }: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const mainAccount = getMainAccount(account, parentAccount);
  const label = useGetStakeLabelLocaleBased();

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const { cardanoResources } = mainAccount as CardanoAccount;
  invariant(cardanoResources, "cardano account expected");

  const disableStakeButton =
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    !canStake(account as CardanoAccount) || isAlreadyStaking(account as CardanoAccount);

  const disabledLabel =
    cardanoResources.delegation && cardanoResources.delegation.poolId
      ? t("cardano.delegation.assetsAlreadyStaked")
      : mainAccount.balance.isZero()
        ? t("cardano.delegation.addFundsToStake")
        : "";

  const onClick = useCallback(() => {
    dispatch(
      openModal("MODAL_CARDANO_REWARDS_INFO", {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
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
      label,
      tooltip: disabledLabel,
      accountActionsTestId: "stake-button",
    },
  ];
};

export default AccountHeaderActions;
