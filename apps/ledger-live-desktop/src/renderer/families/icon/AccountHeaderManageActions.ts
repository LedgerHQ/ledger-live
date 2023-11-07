import { isAccountEmpty } from "@ledgerhq/live-common/account/index";
import { getAccountUnit, getMainAccount } from "@ledgerhq/live-common/account/index";
import type { SubAccount, AccountLike } from "@ledgerhq/types-live";
import { IconAccount } from "@ledgerhq/live-common/families/icon/types";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import IconCoins from "~/renderer/icons/Coins";
import { localeSelector } from "~/renderer/reducers/settings";
import { BigNumber } from "bignumber.js";
import { IconFamily } from "./types";

type Props = {
  account: IconAccount | SubAccount;
  parentAccount: IconAccount | undefined | null;
  source?: string;
};
// type Props = {
//   account: AccountLike;
//   parentAccount: Account | undefined | null;
// };

const AccountHeaderManageActions: IconFamily["accountHeaderManageActions"] = ({
  account,
  parentAccount,
  source = "Account Page",
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const locale = useSelector(localeSelector);
  const unit = getAccountUnit(account);
  const mainAccount = getMainAccount(account, parentAccount);
  const minAmount = 10 ** unit.magnitude;
  const { iconResources, spendableBalance } = mainAccount;
  const votingPower = iconResources?.votingPower ?? 0;
  const earnRewardDisabled = votingPower === 0 && spendableBalance.lt(minAmount);

  // const onClick = useCallback(() => {
  //   if (votingPower > 0 || iconResources.votes?.length > 0) {
  //     dispatch(
  //       openModal("MODAL_MANAGE_ICON", {
  //         parentAccount,
  //         account,
  //       }),
  //     );
  //   } else {
  //     dispatch(
  //       openModal("MODAL_ICON_REWARDS_INFO", {
  //         parentAccount,
  //         account,
  //       }),
  //     );
  //   }
  // }, [votingPower, iconResources.votes?.length, dispatch, parentAccount, account]);
  const onClick = useCallback(() => {
    if (isAccountEmpty(account)) {
      dispatch(
        openModal("MODAL_NO_FUNDS_STAKE", {
          account,
          parentAccount,
        }),
      );
    } else {
      if (account.type === "Account") {
        dispatch(
          openModal("MODAL_MANAGE_ICON", {
            account,
            source,
          }),
        );
      }
    }
  }, [account, dispatch, parentAccount, source]);
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
      event: "button_clicked",
      eventProperties: {
        button: "stake",
      },
    },
  ];
};
export default AccountHeaderManageActions;
