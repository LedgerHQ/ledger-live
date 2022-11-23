// @flow

import { useCallback, useMemo } from "react";
import { BigNumber } from "bignumber.js";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { denominate } from "@ledgerhq/live-common/families/elrond/helpers/denominate";
import { useElrondRandomizedValidators } from "@ledgerhq/live-common/families/elrond/react";

import { modals } from "./modals";
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
  const validators = useElrondRandomizedValidators();

  const earnRewardEnabled = useMemo(
    (): boolean =>
      BigNumber(denominate({ input: account.spendableBalance, showLastNonZeroDecimal: true })).gte(
        1,
      ),
    [account.spendableBalance],
  );

  const hasDelegations = account.elrondResources
    ? account.elrondResources.delegations.length > 0
    : false;

  const onClick = useCallback(() => {
    if (hasDelegations) {
      dispatch(
        openModal(modals.stake, {
          account,
          validators,
        }),
      );
    } else {
      dispatch(
        openModal(modals.rewards, {
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
