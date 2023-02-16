// @flow
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import type { Account, AccountLike } from "@ledgerhq/live-common/types";
import invariant from "invariant";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import IconCoins from "~/renderer/icons/Coins";
import { canDelegate } from "@ledgerhq/live-common/families/avalanchepchain/utils";

type Props = {
  account: AccountLike,
  parentAccount: ?Account,
};

const AccountHeaderActions = ({ account, parentAccount }: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const mainAccount = getMainAccount(account, parentAccount);
  const { avalanchePChainResources } = mainAccount;
  invariant(avalanchePChainResources, "Avalanche account with avalanchePChainResources expected");
  const isDelegationEnabled = canDelegate(account);

  const hasDelegations = avalanchePChainResources.delegations.length > 0;

  const onClick = useCallback(() => {
    if (hasDelegations) {
      dispatch(
        openModal("MODAL_AVALANCHE_DELEGATE", {
          account,
        }),
      );
    } else {
      dispatch(
        openModal("MODAL_AVALANCHE_REWARDS_INFO", {
          account,
        }),
      );
    }
  }, [dispatch, account, hasDelegations]);

  if (parentAccount) return null;

  return [
    {
      key: "Stake",
      onClick: onClick,
      icon: IconCoins,
      disabled: !isDelegationEnabled,
      label: t("account.stake"),
      tooltip: !isDelegationEnabled ? t("avalanchepchain.delegation.notEnoughToDelegate") : null,
    },
  ];
};

export default AccountHeaderActions;
