// @flow

import { useCallback, useState, useMemo, useEffect } from "react";
import { BigNumber } from "bignumber.js";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import invariant from "invariant";
import axios from "axios";

import { denominate } from "~/renderer/families/elrond/helpers";
import { constants } from "~/renderer/families/elrond/constants";
import { openModal } from "~/renderer/actions/modals";
import IconCoins from "~/renderer/icons/Coins";

import type { Account, AccountLike } from "@ledgerhq/types-live";

type Props = {
  account: AccountLike,
  parentAccount: ?Account,
};

const AccountHeaderActions = ({ account, parentAccount }: Props) => {
  const [validators, setValidators] = useState([]);

  const { t } = useTranslation();
  const dispatch = useDispatch();
  const mainAccount = getMainAccount(account, parentAccount);

  const { elrondResources } = mainAccount;
  invariant(elrondResources, "elrond account expected");
  const earnRewardEnabled = useMemo(() => BigNumber(denominate({ input: account.balance })).gt(1), [
    account.balance,
  ]);

  const hasDelegations = elrondResources.delegations.length > 0;

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

  const fetchValidators = useCallback(() => {
    const fetchData = async (): Promise<void> => {
      try {
        const providers = await axios.get(constants.providers);

        const randomize = providers =>
          providers
            .map(provider => ({ provider, sort: Math.random() }))
            .sort((alpha, beta) => alpha.sort - beta.sort)
            .map(item => item.provider);

        setValidators(randomize(providers.data));
      } catch (error) {
        setValidators([]);
      }
    };

    fetchData();

    return () => setValidators([]);
  }, [constants.providers]);

  useEffect(fetchValidators, [fetchValidators]);

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
