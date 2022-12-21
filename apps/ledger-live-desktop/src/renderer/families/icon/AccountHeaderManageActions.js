// @flow
import { getAccountUnit, getMainAccount } from "@ledgerhq/live-common/account/index";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import IconCoins from "~/renderer/icons/Coins";
import { localeSelector } from "~/renderer/reducers/settings";
import { BigNumber } from "bignumber.js";

type Props = {
  account: AccountLike,
  parentAccount: ?Account,
};

const AccountHeaderManageActionsComponent = ({ account, parentAccount }: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const locale = useSelector(localeSelector);
  const unit = getAccountUnit(account);
  const mainAccount = getMainAccount(account, parentAccount);
  const minAmount = 10 ** unit.magnitude;

  const { iconResources, spendableBalance } = mainAccount;
  const votingPower = iconResources?.votingPower ?? 0;
  const earnRewardDisabled = votingPower === 0 && spendableBalance.lt(minAmount);

  const onClick = useCallback(() => {
    if (votingPower > 0 || iconResources.votes?.length > 0) {
      dispatch(
        openModal("MODAL_MANAGE_ICON", {
          parentAccount,
          account,
        }),
      );
    } else {
      dispatch(
        openModal("MODAL_ICON_REWARDS_INFO", {
          parentAccount,
          account,
        }),
      );
    }
  }, [dispatch, votingPower, account, parentAccount]);

  if (parentAccount) return null;

  const formattedMinAmount = formatCurrencyUnit(unit, BigNumber(minAmount), {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
    locale,
  });

  const disabledLabel = earnRewardDisabled
    ? `${t("icon.voting.warnEarnRewards", { amount: formattedMinAmount })}`
    : undefined;

  return [
    {
      key: "Stake",
      onClick: onClick,
      disabled: earnRewardDisabled,
      icon: IconCoins,
      label: t("account.stake"),
      tooltip: disabledLabel,
    },
  ];
};

const AccountHeaderManageActions = ({ account, parentAccount }: Props) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const { iconResources } = mainAccount;

  if (!iconResources) return null;

  return AccountHeaderManageActionsComponent({ account, parentAccount });
};

export default AccountHeaderManageActions;
