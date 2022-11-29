// @flow
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { canDelegate } from "@ledgerhq/live-common/families/osmosis/logic";
import type { Account, AccountLike } from "@ledgerhq/live-common/types/index";
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

  const { cosmosResources } = mainAccount;
  invariant(cosmosResources, "Osmosis account with cosmosResources expected");
  const earnRewardEnabled = canDelegate(mainAccount);

  const hasDelegations = cosmosResources.delegations.length > 0;

  const onClick = useCallback(() => {
    if (hasDelegations) {
      dispatch(
        openModal("MODAL_OSMOSIS_DELEGATE", {
          account,
        }),
      );
    } else {
      dispatch(
        openModal("MODAL_OSMOSIS_REWARDS_INFO", {
          account,
        }),
      );
    }
  }, [dispatch, account, hasDelegations]);

  if (parentAccount) return null;

  const disabledLabel = earnRewardEnabled ? "" : t("osmosis.delegation.minSafeWarning");

  return [
    {
      key: "Stake",
      onClick: onClick,
      icon: IconCoins,
      disabled: !earnRewardEnabled,
      label: t("account.stake"),
      tooltip: disabledLabel,
    },
  ];
};

export default AccountHeaderActions;
