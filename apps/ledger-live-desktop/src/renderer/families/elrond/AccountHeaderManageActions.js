// @flow

import { useCallback, useMemo } from "react";
import { BigNumber } from "bignumber.js";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";

import { denominate, randomizeProviders } from "~/renderer/families/elrond/helpers";
import { constants } from "~/renderer/families/elrond/constants";
import { openModal } from "~/renderer/actions/modals";
import IconCoins from "~/renderer/icons/Coins";

import type { Account, AccountLike } from "@ledgerhq/types-live";

type Props = {
  account: AccountLike,
  parentAccount: ?Account,
};

const AccountHeaderActions = (props: Props) => {
  const { account, parentAccount } = props;
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const earnRewardEnabled = useMemo(
    () => BigNumber(denominate({ input: account.spendableBalance })).gt(1),
    [account.spendableBalance],
  );

  const validators = useMemo(() => randomizeProviders(account.elrondResources.providers), [
    account.elrondResources.providers,
  ]);

  const hasDelegations = account.elrondResources.delegations.length > 0;
  const onClick = useCallback(() => {
    if (hasDelegations) {
      dispatch(
        openModal(constants.modals.stake, {
          account,
          validators,
        }),
      );
    } else {
      dispatch(
        openModal(constants.modals.rewards, {
          account,
          validators,
        }),
      );
    }
  }, [dispatch, account, validators, hasDelegations]);

  if (parentAccount) return null;

  const disabledLabel = earnRewardEnabled ? "" : t("elrond.delegation.minSafeWarning");

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
